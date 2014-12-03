/**
 * New node file
 */

module.exports = 
{
		installHandlers: function(err, session, socket, io, db, rdb, connection) {
			
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

	        // When we receive drawing information:
	        socket.on('mousedot', function(dot){
	            socket.broadcast.emit('mousedot', dot);

	            // Post to the database here:				
	            dot.drag ? db.drawDot(dot) : db.eraseDot(dot);				
	        });

	        // On client disconnection, update the database:
	        socket.on('disconnect', function(){
				db.deactivateUser(session.sessionAccessCode);
				db.getActiveUsersCount();
				rdb.delParticipant(session.sessionGroup, session.sessionAccessCode);
	        });			
		}		
};