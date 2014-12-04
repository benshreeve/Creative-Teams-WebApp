/**
 * New node file
 */

module.exports = 
{
		installHandlers: function(err, session, socket, io, db, rdb, connection) {
			
	        // When a client requests its session:
	        socket.on('requestSession', function() {
	            socket.emit('sessionRequest', {sessionColor: session.UserID == 1 ? "purple" : "red", 
	            							   sessionGroup: session.TeamID,
	            							   sessionAccessCode: session.AccessCode,
	            							   sessionMinScreen: 2,
	            							   sessionMaxScreen: 2,
	            							   sessionScreen: 2,
	            							   sessionCollaborative: true,
	            							   sessionDrawable: "true",
	            							   sessionBackground: "../images/picturecompletion/TTCT_Fig_Parts_Figure_1.svg",
	            							   sessionNickName: session.Name
	            							   });
				//sendState(session.sessionScreen);
	            db.getTransactions(1, 0, 1, sendTransactions);
	        });
			
			// When a client requests its session ID only:
	        socket.on('sessionTitle', function() {
	            socket.emit('sessionRequest', session);
				//sendState(session.sessionScreen);
	        });
			
			/*
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
	        */
	        function sendTransactions(rows) {
                for(var i = 0; i<rows.length; i++) {
                	var oData = eval('(' + rows[i].OperationData + ')');
                	var drag = rows[i].Operation == 1 ? true : false;
                	var color = "rgba(0,0,0,1)";
                	if (drag) {
                		color = rows[i].UserID == 1 ? "purple" : "red"
                	}
                	//console.log("oData: ", oData, "operation:", rows[i].Operation, "drag:", drag, "color: ", color);                	
                    socket.emit('mousedot', {x:oData.x, y:oData.y, drag:drag, rad:6, colour:color, 
                    		owner:'s'+rows[i].TeamID+'p'+rows[i].UserID, group:rows[i].TeamdID, screen:2});
                }	        	
	        }

	        // When we receive drawing information:
	        socket.on('mousedot', function(dot){
	            socket.broadcast.emit('mousedot', dot);

	            // Post to the database here:				
	            dot.drag ? db.drawDot(dot) : db.eraseDot(dot);				
	        });

	        // On client disconnection, update the database:
	        socket.on('disconnect', function(){
				db.deactivateUser(session.TeamID, session.UserID);
				db.getActiveUsersCount();
				rdb.delParticipant(session.TeamID, session.AccessCode);
	        });			
		}		
};