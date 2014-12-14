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
			io.sockets.sockets[accessCode].leave(teamID);
		},

		setup: function(socket, accessCode) {
			io.sockets.sockets[accessCode] = socket;
		},
		
		disconnect: function(accessCode) {
			io.sockets.sockets[accessCode] = undefined;
		},
		
		sendToUser: function(accessCode, cmd, args) {
			io.sockets.sockets[accessCode].emit(cmd, args);
		},
		
		sendToMinID: function(teamID, cmd, args) {
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
		    
		    if (minID != 9999) {
		    	this.sendToUser(ac, cmd, args);
		    } else {
		    	logger.debug("no user in team "+teamID+" is available ...");
		    }
		    		 
		},

		sendToTeam: function(teamID, cmd, args) {
			io.to(teamID).emit(cmd, args)
		},
		
		sendToAll: function(cmd, args) {
		    for (var a in io.sockets.sockets) {
		    	if (utils.checkAccessCode(a) && io.sockets.sockets[a] != undefined)
		    		io.sockets.sockets[a].emit(cmd, args);
		    }
		}
	
				
	};
};