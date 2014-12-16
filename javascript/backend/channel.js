/**
 * New node file
 */

module.exports = function (io) {
	utils = require('./utils.js')();
	logger = require('./logger.js')();
	
	return {
		joinTeam: function(accessCode, teamID) {
			io.sockets.sockets[accessCode].join(teamID);
		},

		leaveTeam: function(accessCode, teamID) {
			try {
				io.sockets.sockets[accessCode].leave(teamID);
			} catch(ex) {
				logger.debug("socket for " + accessCode + " already disconnected.");
			}
		},

		setup: function(socket, accessCode) {
			io.sockets.sockets[accessCode] = socket;
		},
		
		disconnect: function(accessCode) {
			io.sockets.sockets[accessCode] = undefined;
		},
		
		sendToUser: function(accessCode, cmd, args) {
			try {
				io.sockets.sockets[accessCode].emit(cmd, args);
			} catch(ex) {
				logger.debug("socket for " + accessCode + " already disconnected.");
			}				
		},
		
		sendToMinID: function(teamID, cmd, args) {
			var minID = this.getMinID(teamID);
		    if (minID != '') {
		    	this.sendToUser(minID, cmd, args);
		    } else {
		    	logger.debug("no user in team "+teamID+" is available ...");
		    }
		    		 
		},

		sendToTeam: function(teamID, cmd, args) {
			try {
				io.to(teamID).emit(cmd, args)
			} catch(ex) {
				logger.debug("Error sending to team: "+teamID);
			}				
		},
		
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