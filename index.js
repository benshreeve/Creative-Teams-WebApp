var app = require('express')()
  , express = require('express')
  , connect = require('connect')
  , http = require('http').Server(app)
  , path = require('path')
  , request = require("request")
  , io = require('socket.io')(http);
 
// Cookie and Session Requirements:
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var sessionStore = new RedisStore();

 // Connection to the Database:
var db = require('mysql');
var connection =  db.createConnection({ host : '127.0.0.1', user : 'root', password: 'R00t' });
connection.query('use DrawingApp');
var strQuery = 'select * from users';	
  
connection.query( strQuery, function(err, rows){
	if(err)	{
		throw err;
	}else{
		//console.log( rows );
	}
});  

// Session Information:
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser("your secret sauce"));
app.use(session({
    secret: "your secret sauce",
	store: sessionStore,	
    //key: 'connect.sid',
    //cookie: {secure: true, maxAge: 600000, },
	resave: true,
	saveUninitialized: true,
}));


// Initialise Socket Sessions:
var SessionSockets = require('session.socket.io');
var sessionSockets = new SessionSockets(io, sessionStore, cookieParser("your secret sauce"));

/* Routing Functions:*/

// Checks if user is logged in.  If not, redirect to Login.
function protectPage(req, res, redirectUrl) {
	if(req.session.sessionAccessCode) res.redirect(redirectUrl);
	else res.redirect("/public/");
}

// Show an error message if we call this function.
function serveError(res, info) {
	res.send("Oops! There's been a gremlin in the system somewhere.  Please inform your supervisor that- " + info);
}

// Redirect user to /public directory:
app.get('/', function(req, res) {
	res.redirect("./public/");
});

// Serve the Login Page:
app.get('/public/', function(req, res) {
	res.redirect("index.html");
});

// Serve the Practice Canvas:
app.get('/test1/', function(req, res) {	
	protectPage(req, res, "/test1/index.html");
});

// Static File Serving:
app.use(express.static(__dirname, '/public'));

app.post("/public/*", function(req, res) {
    var accesscode = req.body.accesscode;
	var nicknamechosen = req.body.nickname;
	
    var loginQuery = 'select * from users where users.accessid = "'+ accesscode +'";';

    connection.query( loginQuery, function(err, rows){
        if(err)	{
            throw err;
        }else{
			// If it is a valid access code:
			if(rows.length > 0) {
			
				if(rows[0].active == "0") {
					
					// Update the database about the nickname:
					var post  = {nickname: nicknamechosen};
					var query = connection.query('UPDATE users SET ? WHERE users.accessid = "'+accesscode+'"', post, function(err, result) {});
					//console.log(query.sql);
					
					// Write this info to the session:
					req.session.sessionAccessCode = accesscode;	
					req.session.sessionNickName = nicknamechosen;
					req.session.sessionColour = rows[0].colour;
					req.session.sessionGroup = rows[0].group;
					
					req.session.save();
					
					// Finally, Redirect:
					res.redirect("/test1/");
					res.end();
					
				}
				else {
					// Then this user is already logged in:
					//res.send("This user is already logged in.  Can't be having doppelgangers, can we?");
					serveError(res, "This user has already logged in.  Duplicates aren't allowed...");
					res.end();
				}
			}
			else {
				// If login details are incorrect, redirect back to root:
				res.redirect("/");
				res.end();
			}
				
        }
    });


});

// Socket Procedures:
sessionSockets.on('connection', function(err, socket, session){

	// Send the client its information:
	socket.emit('session', session);	
	session.foo = 'test';
	session.save();
	
	// For now, assume the screen number will be 2:
	sendState(2);
	
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
						socket.emit('switchResponse', {response: true, reason: data.intention, bgimage: result[0].bgimage, collaborative:result[0].collaborative });
						sendState(data.screenNumber + 1);
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

http.listen(4000, function(){
	console.log('listening on *:4000');
});