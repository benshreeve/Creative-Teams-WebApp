/**
 * New node file
 */

module.exports = function (io) {
	utils = require('./utils.js');
	
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
		
		sendToUser: function(accessCode, cmd, args) {
			io.sockets.sockets[accessCode].emit(cmd, args);
		},
		
		sendToSmallestID: function(teamID, cmd, args) {
			var smallestID = 9999;
			var ac = '';
		    for (var a in io.sockets.sockets) {
		    	if (utils.checkAccessCode(a) && (utils.getTeamID(a) == teamID)) {
		    		uid = utils.getUserID(a);
		    		if (uid < smallestID) {
		    			smallestID = uid;
		    			ac = a;
		    		}
		    	}
		    }
		    
		    if (smallestID != 9999) {
		    	this.sendToUser(ac, cmd, args);
		    } else {
		    	console.log("no user in team "+teamID+" is available ...");
		    }
		    		 
		},

		sendToTeam: function(teamID, cmd, args) {
			io.to(teamID).emit(cmd, args)
		},
		
		sendToAll: function(cmd, args) {
		    for (var a in io.sockets.sockets) {
		    	if (utils.checkAccessCode(a))
		    		io.sockets.sockets[a].emit(cmd, args);
		    }
		}
	
				
	};
};