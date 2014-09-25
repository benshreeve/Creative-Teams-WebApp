
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
session = require('express-session');


if (process.env.REDISTOGO_URL) {

	console.log("Env variable: " + process.env.REDISTOGO_URL);
	var rtg = require("url").parse(process.env.REDISTOGO_URL);
	console.log("-----------After require");
	var RedisStore = require("redis").createClient(rtg.port, rtg.hostname);
	console.log("-------------After RedisStore initialisation");
	RedisStore.auth(rtg.auth.split(":")[1]);
	console.log("--------------After Auth");
	
	
	RedisStore.on("error", function(err) {
		console.log("Error " + err);
	});
	
	
} else {
    var RedisStore = require("connect-redis")(session);
}


console.log("-------------- Passed initialisation step ");




//var RedisStore = require("connect-redis")(session),
var sessionStore = RedisStore,
SessionSockets = require('session.socket.io'),
db = require('mysql');

console.log("----------------- After session declaration ");

 // Connect to the database:
var connection =  db.createConnection({ host : '127.0.0.1', user : 'root', password: 'R00t' });
connection.query('use DrawingApp');

console.log("-------------------- After DB declaration ");

// Reset all users active flags to inactive, in case of crash:
var query = connection.query('UPDATE users SET active = 0', function(err, result) {});

// Set up sessions (and their cookies):
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser("gZB8fSdS"));
app.use(session({ secret: "gZB8fSdS", store: sessionStore, resave: true, saveUninitialized: true, }));

console.log("-------------------- Session Setup ");

// Initialise Socket Sessions:
var sessionSockets = new SessionSockets(io, sessionStore, cookieParser("gZB8fSdS"));

console.log("-------------------- After Session Sockets ");


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
function serveError(res, info) { 	res.send("Oops! Please inform your supervisor that- " + info); 	}

// Direct to login, or skip if session exists:
app.get('/', function(req, res) { 	
	if(req.session.sessionAccessCode) res.redirect("/test1/index.html");
	else {res.redirect("./public/"); console.log("------------------------- Redirected to Public");}
});

// Route to clear a session (for testing purposes):
app.get('/clearsession/', function(req, res) { if(req.session.destroy()) res.send("Session cleared."); });

// Serve the Login Page:
app.get('/public/', function(req, res) {	res.redirect("index.html"); 	});

// Serve the Practice Canvas:
app.get('/test1/', function(req, res) {		protectPage(req, res, "/test1/index.html");		});

// Static File Serving:
app.use(express.static(__dirname, '/public'));



/* ------------------------------------------------------------------------- */
/*							Login Form Submit (POST)						 */
/* ------------------------------------------------------------------------- */

app.post("/public/*", function(req, res) {
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
				
				connection.query('select bgimage from screens, users where users.accessid = "'+ req.body.accesscode +'" and screens.ID = '+ req.session.sessionScreen +';', function(err, result){
					if(err) throw err;
					req.session.sessionBackground = result[0].bgimage;
					req.session.save();
				});			
				
				// Finally, Redirect:
				res.redirect("/test1/");
			}
			else serveError(res, "This user has already logged in.  Duplicates aren't allowed...");
		}
		else res.redirect("/");		
    });
});




/* ------------------------------------------------------------------------- */
/*								Socket Procedures							 */
/* ------------------------------------------------------------------------- */


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



/* ------------------------------------------------------------------------- */
/*								Listening Port								 */
/* ------------------------------------------------------------------------- */

http.listen(process.env.PORT || 4000, function(){ console.log('listening on *:4000'); });

