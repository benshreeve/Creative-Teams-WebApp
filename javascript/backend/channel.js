/**
 * Author: Habib Naderi
 * Department of Computer Science, University of Auckland
 * 
 * This module implements a set of methods for creating and managing communication channel (socket) between
 * frontend(s) and backend.
 */

module.exports = function (io) {
	utils = require('./utils.js')();
	logger = require('./logger.js')();
	
	return {
		// Joins the client's socket (from the frontend which uses accessCode) to the team's room.
		joinTeam: function(accessCode, teamID) {
			io.sockets.sockets[accessCode].join(teamID);
		},

		// removes the client's socket (from the frontend which uses accessCode) from the team's room.
		leaveTeam: function(accessCode, teamID) {
			try {
				io.sockets.sockets[accessCode].leave(teamID);
			} catch(ex) {
				logger.debug("socket for " + accessCode + " already disconnected.");
			}
		},

		// associates a socket with an access code.
		setup: function(socket, accessCode) {
			io.sockets.sockets[accessCode] = socket;
		},
		
		// removes association between a socket and an access code. 
		disconnect: function(accessCode) {
			io.sockets.sockets[accessCode] = undefined;
		},
		
		// sends a message to the user specified by accessCode.
		sendToUser: function(accessCode, cmd, args) {
			try {
				io.sockets.sockets[accessCode].emit(cmd, args);
			} catch(ex) {
				logger.debug("socket for " + accessCode + " already disconnected.");
			}				
		},
		
		// sends a message to the user with minimum user ID in a team.
		sendToMinID: function(teamID, cmd, args) {
			var minID = this.getMinID(teamID);
		    if (minID != '') {
		    	this.sendToUser(minID, cmd, args);
		    } else {
		    	logger.debug("no user in team "+teamID+" is available ...");
		    }
		    		 
		},

		// sends a message to all members of a team.
		sendToTeam: function(teamID, cmd, args) {
			try {
				io.to(teamID).emit(cmd, args)
			} catch(ex) {
				logger.debug("Error sending to team: "+teamID);
			}				
		},
		
		// sends a message to all connected clients.
		sendToAll: function(cmd, args) {
		    for (var a in io.sockets.sockets) {
		    	if (utils.checkAccessCode(a) && io.sockets.sockets[a] != undefined)
		    		try {
		    			io.sockets.sockets[a].emit(cmd, args);
					} catch(ex) {
						logger.debug("socket for " + a + " already disconnected.");
					}		    			
		    }
		},
		
		// returns the access code of the user with minimum user ID in a team which is connected (logged in)
		// at the moment.
		getMinID: function(teamID) {
			var minID = 9999;
			var ac = '';
		    for (var a in io.sockets.sockets) {
		    	if (utils.checkAccessCode(a) && (utils.getTeamID(a) == teamID)) {
		    		uid = utils.getUserID(a);
		    		if (uid < minID && io.sockets.sockets[a] != undefined) {
		    			minID = uid;
		    			ac = a;
		    		}
		    	}
		    }
		    return ac;			
		}
					
	};
};