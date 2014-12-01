/**
 * New node file
 */

module.exports = 
{
		install_handlers: function(err, connection, io, session, socket) {
			var minScreen = 2;
			var maxScreen = 2;
			var totalUsers = 0;
			
	        // When a client requests its session:
	        socket.on('requestSession', function() {
	            socket.emit('sessionRequest', session);
				sendState(session.sessionScreen);
	        });
			
			// When a client requests its session ID only:
	        socket.on('sessionTitle', function() {
	            socket.emit('sessionRequest', session);
				//sendState(session.sessionScreen);
	        });
			
			// When receive blockIdeaTitle/releaseIdeaTitle
			socket.on('blockIdeaTitle', function() {			
				socket.broadcast.emit('clientBlockIdeaTitle', session);     
	        });
			socket.on('releaseIdeaTitle', function() {			
				socket.broadcast.emit('clientReleaseIdeaTitle', session);     
	        });
			socket.on('enterIdeaTitle', function(text) {
				//console.log(text);			
				socket.broadcast.emit('clientEnterIdeaTitle', text);     
	        });
			
			// When receive blockIdeaDescription/releaseIdeaDescription
			socket.on('blockIdeaDescription', function() {
				socket.broadcast.emit('clientBlockIdeaDescription', session);     
				console.log("blockIdeaDescription");            
	        });
			socket.on('releaseIdeaDescription', function() {
				socket.broadcast.emit('clientReleaseIdeaDescription', session);     
				console.log("releaseIdeaDescription"); 			
				//socket.broadcast.emit('clientReleaseIdeaTitle', session);     
	        });
			socket.on('enterIdeaDescription', function(text) {
				socket.broadcast.emit('clientEnterIdeaDescription', text);  
				console.log("enterIdeaDescription"); 
				//console.log(text);			
				//socket.broadcast.emit('clientEnterIdeaTitle', text);     
	        });
			
			socket.on('submitIdea', function(idea, description) {
				socket.emit('clientSubmitIdea', idea, description);  
				socket.broadcast.emit('clientSubmitIdea', idea, description); 
				//console.log("Submit Idea and Description"); 
				//console.log(text);			
				//socket.broadcast.emit('clientEnterIdeaTitle', text);     
	        });
			
			function readState(screenNumber, limit1, limit2){
				var stuff = connection.query('select * from transactions where transactions.screen = "'+ screenNumber +'" and transactions.group = "'+session.sessionGroup+'" limit '+limit1+', '+limit2, function(err, rows){
	                if(err) throw err;
	                for(var i = 0; i<rows.length; i++) {
	                    socket.emit('mousedot', {x:rows[i].xpoint, y:rows[i].ypoint, drag:rows[i].drag, rad:rows[i].radius, colour:rows[i].colour, owner:rows[i].owner, group:session.sessionGroup, screen:rows[i].screen});
	                }
	            });	
			}

	        function sendState(screenNumber) {
	            // connect to the database.
	            // emit each row element as a draw to specific socket - use socket.id.
				var rowNumber = 0;
				var stuff = connection.query('select * from transactions where transactions.screen = "'+ screenNumber +'" and transactions.group = "'+session.sessionGroup+'"', function(err, rows)
				//var stuff = connection.query('select * from transactions where transactions.screen = "'+ screenNumber +'" and transactions.group = "'+session.sessionGroup+'" limit 1000', function(err, rows)
				{
	                rowNumber = rows.length;
					console.log("row number = " + rowNumber);
					for(var i = 0; i<rowNumber; i=i+10) {
						setTimeout(readState(screenNumber, i, 10), 20*i);
					}
	            });
				

	            
	        }


	        // When a client intends to move forward/back:
	        socket.on('switchRequest', function(data) {
			
				screenNumber = parseInt(data.screenNumber);

	            console.log("Intention received: " + data.intention + " and scrNum is: " + screenNumber);

	            if(data.intention=="back") {

	                // User can't go back any further:
	                if(screenNumber <3 || screenNumber == minScreen)
	                    socket.emit('switchResponse', {response:false, reason:"This is the start of the test, you can't go back any further."});
	                else {
	                    connection.query('select * from screens where id = "' + (screenNumber-1) + '"', function(errr, result) {
	                        socket.emit('switchResponse', {response: true, reason:data.intention, bgimage: result[0].bgimage, collaborative:result[0].collaborative, drawable:result[0].drawable, newScreenNumber: screenNumber-1 });
	                        sendState(screenNumber - 1);

	                        // Update user's current screen in DB:
	                        connection.query('UPDATE users SET screen = "'+ (screenNumber - 1) +'" WHERE users.accessid = "'+ session.sessionAccessCode + '"', post, function(err, row) {});
	                    });
	                }
	            }
	            else if(data.intention=="next") {
	                // Find out if this is the final screen.  Allow client to proceed if not:
					console.log("-next- block activated");
					
	                connection.query('select max(ID) as "maxval" from screens', function(err, rows){
	                    if(err) throw err;

	                    if (rows[0].maxval == screenNumber || screenNumber == maxScreen)
	                        socket.emit('switchResponse', {response: false, reason: "You can't go to the next part of the test yet."});
	                    else {
	                        // connect to the database AGAIN here:
	                        connection.query('select * from screens where id = "' + ( screenNumber +1 ) + '"', function(errr, result) {
								if(errr) throw err;
								
								console.log("-------------- data.screenNumber+1 was: " + ( screenNumber +1 ) );
								console.log("-------------- data.screenNumber was: " + screenNumber );
								
	                            socket.emit('switchResponse', {response: true, reason: data.intention, bgimage: result[0].bgimage, collaborative:result[0].collaborative, max:rows[0].maxval, drawable:result[0].drawable, newScreenNumber: screenNumber+1 });
	                            sendState(screenNumber + 1);

	                            // Update user's current screen in DB:
	                            connection.query('UPDATE users SET screen = "'+ (screenNumber + 1) +'" WHERE users.accessid = "'+ session.sessionAccessCode + '"', post, function(err, row) {});
	                        });
	                    }
	                });
	            }
	            else {
	            	// Must be a number: intention will be the nunber....
	            	
					 connection.query('select * from screens where id = "' + (data.intention) + '"', function(errr, result) {
						socket.emit('switchResponse', {response: true, reason: data.intention, bgimage: result[0].bgimage, collaborative:result[0].collaborative, drawable:result[0].drawable, newScreenNumber: data.intention });
						sendState(data.intention);

						// Update user's current screen in DB:
						connection.query('UPDATE users SET screen = "'+ (data.intention) +'" WHERE users.accessid = "'+ session.sessionAccessCode + '"', post, function(err, row) {});
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
				totalUsers--;
				io.sockets.emit('totalUsersUpdate', totalUsers);
	            var post  = {active: 0};
	            var query = connection.query('UPDATE users SET ? WHERE users.accessid = "' + session.sessionAccessCode +'";', post, function(err, result) {});

	            connection.query('select * from users where users.active = "1"', function(err, rows){
	                if(err) throw err;
	                console.log("Total number of users is: " + rows.length);
	            });
	        });			
		}		
};