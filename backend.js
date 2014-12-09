
/* ------------------------------------------------------------------------- */
/*								Server Configuration						 */
/* ------------------------------------------------------------------------- */
// Requirements:
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
compression = require('compression');
redis = require('redis')
utils = require('./javascript/backend/utils.js')()


var db, rdb;
var connection;

async.parallel([startBackend(), setupDBs(), setupTimer()]);

function startBackend() {
    // Connect to Redis:
    var RedisStore = require("connect-redis")(session);
    var sessionStore = new RedisStore({host: "130.216.38.234", port:13163, pass: "apple"});

	app.use(compression());
	
    // Set up sessions (and their cookies):
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser("gZB8fSdS"));
    var sessionSockets = new SessionSockets(io, sessionStore, cookieParser("gZB8fSdS"));
    app.use(session({ store: sessionStore, secret: "gZB8fSdS", resave: true, saveUninitialized: true, }));
   
    
    sessionSockets.on('connection', function(err, socket, session){
    	if (err) throw err;
    	
    	channel = require('./javascript/backend/channel.js')(io);
    	
        // Store identification:
        console.log('User: ' + session.AccessCode + ' connected under the nickname ' + session.Name);
		
		channel.setup(socket, session.AccessCode);
			
		if (session.Late)
			installHandlers("10", {session:session, socket:socket, connection:connection, io:io});
		else {
			channel.joinTeam(session.AccessCode, session.TeamID);
			rdb.getCurrentTest(session.TeamID, installHandlers, {session:session, socket:socket, db:db, rdb:rdb, channel:channel});
		}
		
		rdb.addParticipant(session.TeamID, session.AccessCode);
        db.activateUser(session.TeamID, session.UserID);
        
		db.getActiveUsersCount();
    }); 
}

function installHandlers(currentTest, context) {
	require(utils.getTestHandler(currentTest)).installHandlers(context);
}

function setupDBs() {
    connection =  database.createConnection({ host : '130.216.38.45', user : 'b935b086008866', password: '1b01c493', database: 'creativeteams'});
    db = require('./javascript/backend/mysql_db.js')(connection);
    
    // Reset all users active flags to inactive, in case of crash:
    db.deactivateAllUsers();

    connection.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            connection =  database.createConnection({ host : '130.216.38.45', user : 'b935b086008866', password: '1b01c493', database: 'creativeteams'});
            db = require('./javascript/backend/mysql_db.js')(connection);
			console.log("DB Connection ok ");
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });

    var teamStore = redis.createClient(13163, '130.216.38.234', {auth_pass:'apple'});
    rdb = require('./javascript/backend/redis_db.js')(teamStore); 
}

function setupTimer() {	
    setInterval(function() {
    	require('./javascript/backend/channel.js')(io).sendToAll("UpdateTimeMsg", new Date().getTime());
    }, 10*1000);
}

/* ------------------------------------------------------------------------- */
/*								Routing Functions							 */
/* ------------------------------------------------------------------------- */


app.use(function(req, res, next){
  console.log('%s %s', req.method, req.url);
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

app.get('/admin/', checkLogin, function(req, res) { res.redirect("/admin/index.html"); });

// Route to clear a session (for testing purposes):
app.get('/clearsession/', checkLogin, function(req, res) { if(req.session.destroy()) res.send("Session cleared."); });

// Serve the Login Page:
app.get('/public/', function(req, res) {	res.redirect("index.html"); 	});

// Serve the Practice Canvas:
app.get('/test1/', checkLogin, function(req, res) {		res.redirect("index.html")/*protectPage(req, res, "/test1/index.html");*/		});

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

function processNewUser(userRow, args) {
	if (userRow) {
		if (userRow.Active == 0) {
			db.setUserName(userRow.TeamID, userRow.UserID, args.req.body.nickname);
			args.req.session.AccessCode = args.req.body.accesscode;
			args.req.session.Name = args.req.body.nickname;
			args.req.session.TeamID = userRow.TeamID;
			args.req.session.UserID = userRow.UserID;
			rdb.getCurrentTest(userRow.TeamID, setLate, {userSession: args.req.session});
			db.getResultsPath(createTeamFolder, {teamID: userRow.TeamID});
			args.res.redirect("/test1/");
		} else {
			serveError(args.res, "User has already logged in ...");
		}
	} else {
		serveError(args.res, "Invalid access code ...");
	}
	
}

function setLate(teamCurrentTest, args) {
	args.userSession.Late = teamCurrentTest > 1 ? true : false;
	args.userSession.save();		
}

function createTeamFolder(path, args) {
	var fs = require('fs');
	console.log("path:", path);
	if (!fs.existsSync(path+"/"+args.teamID))
		fs.mkdirSync(path+"/"+args.teamID);
}


/* ------------------------------------------------------------------------- */
/*								Listening Port								 */
/* ------------------------------------------------------------------------- */

http.listen(process.env.PORT || 4000, function(){ console.log('listening on *:4000'); });
