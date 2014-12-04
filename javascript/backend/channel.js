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
		
		sendUser: function(accessCode, cmd, args) {
			io.sockets.sockets[accessCode].emit(cmd, args);
		},

		sendTeam: function(teamID, cmd, args) {
			io.to(teamID).emit(cmd, args)
		},
		
		sendAll: function(cmd, args) {
		    for (var a in io.sockets.sockets) {
		    	if (utils.checkAccessCode(a))
		    		io.sockets.sockets[a].emit(cmd, args);
		    }
		}
	
				
	};
};