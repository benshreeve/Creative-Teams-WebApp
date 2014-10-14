
/* ------------------------------------------------------------------------- */
/*								Server Configuration						 */
/* ------------------------------------------------------------------------- */

require('nodetime').profile({
    accountKey: '822b11ec5708d7b08f78be3950807340f092eb1e', 
    appName: 'Creative Teams'
  });


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
SessionSockets = require('session.socket.io');



var connection;

async.parallel([
    connectToRedis(),
    connectToDB()
]);

/*
passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({ username: username }, function (err, user) {
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            if (!user.validPassword(password)) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        });
    }
));
*/


function connectToRedis() {
    // Connect to Redis:
    var RedisStore = require("connect-redis")(session);
    var sessionStore = new RedisStore({host: "pub-redis-13163.eu-west-1-1.2.ec2.garantiadata.com", port:13163, pass: "apple"});

    // Set up sessions (and their cookies):
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser("gZB8fSdS"));
    var sessionSockets = new SessionSockets(io, sessionStore, cookieParser("gZB8fSdS"));
    app.use(session({ store: sessionStore, secret: "gZB8fSdS", resave: true, saveUninitialized: true, }));

    /*
    app.use(passport.initialize());
    app.use(passport.session());
    */

    sessionSockets.on('connection', function(err, socket, session){

        // Firstly send the client its session:
        socket.emit('session', session);
        session.foo = 'test';
        session.save();

        // For now, assume the screen number will be 2:
        sendState(session.sessionScreen);

        // When a client requests its session:
        socket.on('requestSession', function() {
            socket.emit('sessionRequest', session);
        });

        function sendState(screenNumber) {
            // connect to the database.
            // emit each row element as a draw to specific socket - use socket.id.

            var stuff = connection.query('select * from transactions where transactions.screen = "'+ screenNumber +'" and transactions.group = "'+session.sessionGroup+'"', function(err, rows){
                if(err) throw err;
                for(var i = 0; i<rows.length; i++) {
                    socket.emit('mousedot', {x:rows[i].xpoint, y:rows[i].ypoint, drag:rows[i].drag, rad:rows[i].radius, colour:rows[i].colour, owner:rows[i].owner, group:session.sessionGroup, screen:rows[i].screen});
                }
            });
        }


        // When a client intends to move forward/back:
        socket.on('switchRequest', function(data) {

            console.log("Intention received: " + data.intention + " and scrNum is: " + data.screenNumber);

            if(data.intention=="back") {

                // User can't go back any further:
                if(data.screenNumber <3)
                    socket.emit('switchResponse', {response:false, reason:"This is the start of the test, you can't go back any further."});
                else {


                    connection.query('select * from screens where id = "' + (data.screenNumber-1) + '"', function(errr, result) {
                        socket.emit('switchResponse', {response: true, reason:data.intention, bgimage: result[0].bgimage, collaborative:result[0].collaborative });
                        sendState(data.screenNumber - 1);

                        // Update user's current screen in DB:
                        connection.query('UPDATE users SET screen = "'+ (data.screenNumber - 1) +'" WHERE users.accessid = "'+ session.sessionAccessCode + '"', post, function(err, row) {});
                    });


                }

            }
            else if(data.intention=="next") {
                // Find out if this is the final screen.  Allow client to proceed if not:
                connection.query('select max(ID) as "maxval" from screens', function(err, rows){
                    if(err) throw err;

                    if (rows[0].maxval == data.screenNumber)
                        socket.emit('switchResponse', {response: false, reason: "This is the final page, you can't go forward any further."});
                    else {

                        // connect to the database AGAIN here:

                        connection.query('select * from screens where id = "' + (data.screenNumber+1) + '"', function(errr, result) {
                            socket.emit('switchResponse', {response: true, reason: data.intention, bgimage: result[0].bgimage, collaborative:result[0].collaborative, max:rows[0].maxval });
                            sendState(data.screenNumber + 1);

                            // Update user's current screen in DB:
                            connection.query('UPDATE users SET screen = "'+ (data.screenNumber + 1) +'" WHERE users.accessid = "'+ session.sessionAccessCode + '"', post, function(err, row) {});
                        });




                    }

                });
            }


        });

        // Store identification:
        console.log('User: ' + session.sessionAccessCode + ' connected under the nickname ' + session.sessionNickName);
        var post  = {active: 1};
        var query = connection.query('UPDATE users SET ? WHERE users.accessid = "' + session.sessionAccessCode +'";', post, function(err, result) {});

        // Now print out the total number of users:
        connection.query('select * from users where users.active = "1"', function(err, rows){
            if(err) throw err;
            else console.log("Total number of users is: " + rows.length);
        });

        // When we receive drawing information:
        socket.on('mousedot', function(dot){
            //console.log('point: ' + dot.x + ", " + dot.y + " drag is: " + dot.drag + " radius is " + dot.rad + " colour is " + dot.colour + " and owner is: " + dot.owner);
            socket.broadcast.emit('mousedot', dot);

            // Post to the database here:

            var query = connection.query('INSERT INTO `transactions`(`xpoint`, `ypoint`, `drag`, `radius`, `owner`, `time`, `screen`, `colour`, `group`) VALUES ("'+ dot.x +'","'+ dot.y +'","'+ dot.drag +'","'+ dot.rad +'","'+ dot.owner +'", now(6),"'+ dot.screen +'","'+ dot.colour +'","'+ dot.group +'");', post, function(err, result) {
                if(err) throw err;
                console.log("Dot written to database.  Drag is: " + dot.drag);
                console.log("SQL: " + query.sql);
            });

        });

        // When we receive undo info:
        socket.on('undo', function(dot){
            socket.broadcast.emit('undo', dot);
        });

        // On client disconnection, update the database:
        socket.on('disconnect', function(){
            var post  = {active: 0};
            var query = connection.query('UPDATE users SET ? WHERE users.accessid = "' + session.sessionAccessCode +'";', post, function(err, result) {});

            connection.query('select * from users where users.active = "1"', function(err, rows){
                if(err) throw err;
                console.log("Total number of users is: " + rows.length);
            });
        });
    });





}



// Connect to the database (LOCAL SETTINGS):
//var connection =  database.createConnection({ host : '127.0.0.1', user : 'root', password: 'R00t' });
//connection.query('use DrawingApp');

function connectToDB() {
    connection =  database.createConnection({ host : 'eu-cdbr-west-01.cleardb.com', user : 'b935b086008866', password: '1b01c493', database: 'heroku_8ca30c1ed121d0a'});

    // Reset all users active flags to inactive, in case of crash:
    var query = connection.query('UPDATE users SET active = 0', function(err, result) {});

    connection.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            connectToDB();                         // lost due to either server restart, or a
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
    connection.query('select * from users where users.accessid = "'+ req.body.accesscode +'";', function(err, rows){
        if(err) throw err;

		// If it is a valid access code:
		if(rows.length > 0) {
		
			// If the user has not already logged in somewhere:
			if(rows[0].active == "0") {
				
				// Update the database about the nickname:
				var post  = {nickname: req.body.nickname};
				var query = connection.query('UPDATE users SET ? WHERE users.accessid = "'+ req.body.accesscode+ '"', post, function(err, row) {});
				
				// Write this info to the session:
				req.session.sessionAccessCode = req.body.accesscode;	
				req.session.sessionNickName = req.body.nickname;
				req.session.sessionColour = rows[0].colour;
				req.session.sessionGroup = rows[0].group;
				req.session.sessionScreen = rows[0].screen;
				
				connection.query('select bgimage, collaborative from screens, users where users.accessid = "'+ req.body.accesscode +'" and screens.ID = '+ req.session.sessionScreen +';', function(err, result){
					if(err) throw err;
					req.session.sessionBackground = result[0].bgimage;
					req.session.sessionCollaborative = result[0].collaborative;
					req.session.save();
				});			
				
				// Finally, Redirect:
				res.redirect("/test1/");
			}
			else serveError(res, "This user has already logged in.  Duplicates aren't allowed...");
		}
		else res.redirect("/");		
    });
	}
	catch(e) {
		console.log(e);
	
	}
});




/* ------------------------------------------------------------------------- */
/*								Socket Procedures							 */
/* ------------------------------------------------------------------------- */





/* ------------------------------------------------------------------------- */
/*								Listening Port								 */
/* ------------------------------------------------------------------------- */

http.listen(process.env.PORT || 4000, function(){ console.log('listening on *:4000'); });

