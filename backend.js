/**
 * Author: Habib Naderi (Department of Computer Science, University of Auckland)
 *         Adam (University of Lancaster)
 * 
 * 
 * This is the main module for the backend. It setup databases, timer for time synchronization and an http server
 * to listen on port 4000. 
 */


var app = require('express')(),
express = require('express'),
connect = require('connect'),
http = require('http').Server(app),
path = require('path'),
request = require("request"),
io = require('socket.io')(http),
bodyParser = require('body-parser'),
cookieParser = require('cookie-parser'),
session = require('express-session'),
url = require('url'),
async = require('async'),
passport = require('passport'),
LocalStrategy = require('passport-local').Strategy,
database = require('mysql'),
SessionSockets = require('session.socket.io'),
compression = require('compression'),
redis = require('redis'),
utils = require('./javascript/backend/utils.js')(),
logger = require('./javascript/backend/logger.js')();

utils.includeConstants("./javascript/backend/constants.js");

var db, rdb;
var connection;

async.parallel([startBackend(), setupDBs(), setupTimer()]);

// starts backend and waits for connection from frontends.
function startBackend() {
    // Connect to Redis:
    var RedisStore = require("connect-redis")(session);
    var sessionStore = new RedisStore({host: REDIS_HOST, port:REDIS_PORT, pass: REDIS_PASSWORD, ttl:REDIS_TTL});

	app.use(compression());
	
    // Set up sessions (and their cookies):
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser("gZB8fSdS"));
    var sessionSockets = new SessionSockets(io, sessionStore, cookieParser("gZB8fSdS"));
    app.use(session({ store: sessionStore, secret: "gZB8fSdS", resave: true, saveUninitialized: true, }));
    
    //disable hearbeat. This feature is buggy in socket.io. 
    io.set('heartbeat timeout', 9999999);
    io.set('heartbeat interval', 9999999);
   

    // wait for new connections
    sessionSockets.on('connection', function(err, socket, session){
    	if (!err && session.TeamID != undefined) {
	    	if (session.refCount > 0) {
				rdb.delReadyParticipant(session.TeamID, session.AccessCode);
				session.refCount = 0;
	    	}    	
	    	session.refCount ++;
	    	session.save();
		    	    	
	    	channel = require('./javascript/backend/channel.js')(io);
		    	
	        logger.log('User: ' + session.AccessCode + ' connected under the nickname ' + session.Name);
				
			channel.setup(socket, session.AccessCode);
					
			// if this is a late participant, do not join it to the team at this stage.
			if (session.Late)
				installHandlers(PRAC_AREA, {session:session, socket:socket, db:db, rdb:rdb, channel:channel});
			else {
				channel.joinTeam(session.AccessCode, session.TeamID);
				rdb.getCurrentTest(session.TeamID, installHandlers, {session:session, socket:socket, db:db, rdb:rdb, channel:channel});
			}
				
			rdb.addParticipant(session.TeamID, session.AccessCode);
	        db.activateUser(session.TeamID, session.UserID);
		        
			db.getActiveUsersCount("connect: ");
    	} else {
    		console.log("session got expired. user needs to login again", err);
    	}
    }); 
}

// attach handlers for the current test to the client's socket.
function installHandlers(currentTest, context) {
	require(utils.getTestHandler(currentTest)).installHandlers(context);
}

// setup mysql and redis databases.
function setupDBs() {
    connection =  database.createConnection({ host : MYSQL_HOST, user : MYSQL_USER, password: MYSQL_PASSWORD, database: MYSQL_DB});
    db = require('./javascript/backend/mysql_db.js')(connection);
    
    // Reset all users active flags to inactive, in case of crash:
    db.deactivateAllUsers();

    connection.on('error', function(err) {
        logger.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            connection =  database.createConnection({ host : MYSQL_HOST, user : MYSQL_USER, password: MYSQL_PASSWORD, database: MYSQL_DB});
            db = require('./javascript/backend/mysql_db.js')(connection);
			logger.log("DB Connection ok ");
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });

    var teamStore = redis.createClient(REDIS_PORT, REDIS_HOST, {auth_pass:REDIS_PASSWORD});
    rdb = require('./javascript/backend/redis_db.js')(teamStore, db);
}

// creates a timer which expires every UPDATE_TIME_INTERVAL seconds and broadcasts
// server's time to all connected frontends. It helps frontends to adjust their time
// and minimize the drift. 
function setupTimer() {	
    setInterval(function() {
    	require('./javascript/backend/channel.js')(io).sendToAll("UpdateTimeMsg", new Date().getTime());
    }, UPDATE_TIME_INTERVAL*1000);
}

/* ------------------------------------------------------------------------- */
/*								Routing Functions							 */
/* ------------------------------------------------------------------------- */


app.use(function(req, res, next){
  logger.log('%s %s', req.method, req.url);
  next();
});

// Checks if user is logged in.  If not, redirect to Login.
function protectPage(req, res, redirectUrl) {
	 if(req.session.sessionAccessCode) res.redirect(redirectUrl);
	else res.redirect("/public/");
}

// Send an error message to a client:
function serveError(res, info) { res.send("Oops! Please inform your supervisor that- " + info); 	}

// Direct to login, or skip if session exists:
app.get('/', function(req, res) { 	

	if(req.session.accesscode) res.redirect("/test1/index.html");
	else res.redirect("./public/"); 
	
});

// Serve the Login Page:
app.get('/public/', function(req, res) {	res.redirect("index.html"); 	});

// Static File Serving:
app.use(express.static(__dirname, '/public'));
app.use(express.static(__dirname, '/images'));

// route middleware to make sure a user is logged in
function checkLogin(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.session)
        return next();

    // if they aren't redirect them to the login page
    res.redirect('/');
}

/* ------------------------------------------------------------------------- */
/*							Login Form Submit (POST)						 */
/* ------------------------------------------------------------------------- */

app.post("/public/*", function(req, res) {

	if (utils.checkAccessCode(req.body.accesscode)) {
		db.getUser(utils.getTeamID(req.body.accesscode), utils.getUserID(req.body.accesscode), processNewUser, {req:req, res:res});
	}
	else {
		serveError(res, "Invalid access code ...");
	}
});

// processes a new login operation. A user should not be able to login from more than one device at the same time.
function processNewUser(userRow, args) {
	if (userRow) {
		if (args.req.session && args.req.session.refCount > 0) {
			userRow.Active = 0;
		}
		
		if (userRow.Active == 0) {
			db.setUserName(userRow.TeamID, userRow.UserID, args.req.body.nickname);
			args.req.session.AccessCode = args.req.body.accesscode.toLowerCase();
			args.req.session.Name = args.req.body.nickname;
			args.req.session.TeamID = userRow.TeamID;
			args.req.session.UserID = userRow.UserID;
			args.req.session.refCount = 0;
			rdb.getCurrentTest(userRow.TeamID, setLate, {userSession: args.req.session});
			db.getResultsPath(createTeamFolder, {teamID: userRow.TeamID});			
			args.res.redirect("/assets/tests/introductions.html"+VERSION);
		} else {
			serveError(args.res, "User has already logged in ...");
		}
	} else {
		serveError(args.res, "Invalid access code ...");
	}
	
}

// sets 'Late' field in the user's session if its team has already started the test. 
function setLate(teamCurrentTest, args) {
	args.userSession.Late = teamCurrentTest > PRAC_AREA ? true : false;
	args.userSession.save();		
}

// creates a folder for team's results.
function createTeamFolder(path, args) {
	var fs = require('fs');
	if (!fs.existsSync(path+"/"+args.teamID))
		fs.mkdirSync(path+"/"+args.teamID);
}


/* ------------------------------------------------------------------------- */
/*								Listening Port								 */
/* ------------------------------------------------------------------------- */

logger.log("Backend started on ", Date());
http.listen(process.env.PORT || 4000, function(){ logger.log('listening on *:4000'); });
