/**
 * New node file
 */

module.exports = 
{
		install_handlers: function(err, connection, io, session, socket) {
			socket.on('adminRequest', function(data) {
				if(data == "wipedb") {
					// Wipe the database:
					connection.query('TRUNCATE transactions', function(err, result) { 
						if(err) throw err;
						socket.emit('adminResponse', 'true');
					});
				}
				else if(data == "resetusers") {
					// Reset users:
					connection.query('UPDATE users SET screen = 2', function(err, result) { 
						if(err) throw err;
						socket.emit('adminResponse', 'true');
					});	
				}
			});
			
			// If Admin Screen requests current min/max values:
			socket.on('minMaxRequestValues', function() {
				socket.emit('minMaxResponseValues', {min: session.sessionMinScreen, max: session.sessionMaxScreen});
				console.log("request for session information:"+session.sessionScreen+":"+session.sessionMinScreen+":"+session.sessionMaxScreen);
			});
			
			// If the admin changes the min/max screens:
			socket.on('minMaxRequestUpdate', function(data) {
			
				// Perform basic validation:
				if(data.min <= data.max)  {  
					minScreen = data.min;
					maxScreen = data.max;
					socket.emit('minMaxResponseUpdate', 'true'); 
					
					// Now update the values for the clients and disperse:
					session.sessionMinScreen = minScreen;
					session.sessionMaxScreen = maxScreen;
					io.sockets.emit('screenUpdate', {min:minScreen, max:maxScreen});	
					session.save();
				}
				else socket.emit('minMaxResponseUpdate', 'false');		
			
				console.log("update for session information:"+session.sessionScreen+":"+session.sessionMinScreen+":"+session.sessionMaxScreen);

			});
		}		
};