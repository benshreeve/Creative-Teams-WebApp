
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


var minScreen = 2;
var maxScreen = 2;
var connection;
var db;
var totalUsers = 0;

async.parallel([ connectToRedis(), connectToDB()]);

function connectToRedis() {
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
		io.sockets.emit('totalUsersUpdate', totalUsers);
		
        // Store identification:
        console.log('User: ' + session.sessionAccessCode + ' connected under the nickname ' + session.sessionNickName);
        db.activate_user(session.sessionAccessCode);
		db.get_active_users_count();
		require('./javascript/backend/admin.js').install_handlers(err, connection, io, session, socket);
		require('./javascript/backend/pic_comp.js').install_handlers(err, connection, io, session, socket);		

			
    }); 
}



function connectToDB() {
    connection =  database.createConnection({ host : '130.216.38.45', user : 'b935b086008866', password: '1b01c493', database: 'heroku_8ca30c1ed121d0a'});

    db = require('./javascript/backend/mysql_db.js')(connection);
    // Reset all users active flags to inactive, in case of crash:
    var query = connection.query('UPDATE users SET active = 0', function(err, result) {});

    connection.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            connectToDB();                         // lost due to either server restart, or a
			console.log("DB Connection ok ");
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });

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
	try {

    connection.query('select * from users where users.accessid = '+ connection.escape(req.body.accesscode) +';', function(err, rows){
        if(err) throw err;

		// If it is a valid access code:
		if(rows.length > 0) {
		
			// If the user has not already logged in somewhere:
			if(rows[0].active == "0") {
				
				// Update the database about the nickname:
				var post  = {nickname: req.body.nickname};
				var query = connection.query('UPDATE users SET ? WHERE users.accessid = '+ connection.escape(req.body.accesscode), post, function(err, row) {});
				
				// Write this info to the session:
				req.session.sessionAccessCode = req.body.accesscode;	
				req.session.sessionNickName = req.body.nickname;
				req.session.sessionColour = rows[0].colour;
				req.session.sessionGroup = rows[0].group;
				req.session.sessionScreen = rows[0].screen;
				req.session.sessionMinScreen = minScreen;
				req.session.sessionMaxScreen = maxScreen;
				
				connection.query('select bgimage, collaborative, drawable from screens, users where users.accessid = '+ connection.escape(req.body.accesscode) +' and screens.ID = '+ connection.escape(req.session.sessionScreen) +';', function(err, result){
					if(err) throw err;
					req.session.sessionBackground = result[0].bgimage;
					req.session.sessionCollaborative = result[0].collaborative;
					req.session.sessionDrawable = result[0].drawable;
					req.session.save();
				});			
				
				// Finally, Redirect:
				res.redirect("/test1/");
			}
			else serveError(res, "This user has already logged in.  Duplicates aren't allowed...");
		}
		else { 
			// Instead, try to derive if this is an admin login:
			connection.query('select login from admin where login = ' + connection.escape(req.body.accesscode), function(errr, result) {
				if(result.length > 0) res.redirect("/admin/");
				else res.redirect("/");
			});	
		}		
    });
	}
	catch(e) { console.log(e); }
});


/* ------------------------------------------------------------------------- */
/*								Listening Port								 */
/* ------------------------------------------------------------------------- */

http.listen(process.env.PORT || 4000, function(){ console.log('listening on *:4000'); });
