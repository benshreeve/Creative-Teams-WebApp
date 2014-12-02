/**
 * New node file
 */
module.exports = function (conn) {
	var util = require("./utils.js");
	return {
		addParticipant: function(teamID, accessCode) {
			conn.hgetall(teamID, function(err, reply) {
				if (err) 
					throw err;
				
				if (reply) {
					reply.Participants = util.addItemUnique(reply.Participants, accessCode);
					conn.hmset(teamID, reply);
					console.log("reply: ", reply);
				}
				else {
					console.log("no record for this team. create one ...");
					conn.hmset(teamID, "CurrentTest", 0, 
									   "CurrentScreen", 1,
									   "TextEditingUser", '',
									   "RemainingTime", 9999,
									   "IdeaId", 1,
									   "Participants", accessCode,
									   "ReadyToStart", '');
				}
			});
		},
		
		delParticipant: function(teamID, accessCode) {
			conn.hgetall(teamID, function(err, reply) {
				if (err)
					throw err;
				
				if (reply) {
					reply.Participants = util.delItem(reply.Participants, accessCode);
					conn.hmset(teamID, reply);
					console.log("reply: ", reply);
				} else {
					console.log("no record for this team");
				}
			});
		},
		
		clearParticipants: function(teamID) {
			conn.hgetall(teamID, function(err, reply) {
				if (err) 
					throw err;
				
				if (reply) {
					reply.Participants = '';
					conn.hmset(teamID, reply);
					console.log("reply: ", reply);
				}
			});
		},
		

		addReadyParticipant: function(teamID, accessCode) {
			conn.hgetall(teamID, function(err, reply) {
				if (err) 
					throw err;
				
				if (reply) {
					reply.ReadyToStart = util.addItemUnique(reply.ReadyToStart, accessCode);
					conn.hmset(teamID, reply);
					console.log("reply: ", reply);
				}
			});
		},
		
		clearReadyParticipants: function(teamID) {
			conn.hgetall(teamID, function(err, reply) {
				if (err) 
					throw err;
				
				if (reply) {
					reply.ReadyToStart = '';
					conn.hmset(teamID, reply);
					console.log("reply: ", reply);
				}
			});
		},
		
		setTextEditingUser: function(teamID, accessCode) {
			conn.hgetall(teamID, function(err, reply) {
				if (err) 
					throw err;
				
				if (reply) {
					reply.TextEditingUser = accessCode;
					conn.hmset(teamID, reply);
					console.log("reply: ", reply);
				}
			});			
		},

		getTextEditingUser: function(teamID, callback) {
			conn.hgetall(teamID, function(err, reply) {
				if (err) 
					throw err;
				
				if (reply) {
					callback(reply.TextEditingUser);
					console.log("reply: ", reply);
				}
			});			
		},
		
		setIdeaID: function(teamID, ideaID) {
			conn.hgetall(teamID, function(err, reply) {
				if (err) 
					throw err;
				
				if (reply) {
					reply.IdeaId = ideaID;
					conn.hmset(teamID, reply);
					console.log("reply: ", reply);
				}
			});			
		},
		
		getIdeaID: function(teamID, callback) {
			conn.hgetall(teamID, function(err, reply) {
				if (err) 
					throw err;
				
				if (reply) {
					callback(reply.IdeaId);
					console.log("reply: ", reply);
				}
			});			
		},

		genIdeaID: function(teamID, callback) {
			conn.hgetall(teamID, function(err, reply) {
				if (err) 
					throw err;
				
				if (reply) {
					var id = reply.IdeaId ++;
					conn.hmset(teamID, reply);
					callback(id);
					console.log("reply: ", reply);
				}
			});			
		},
		
		setCurrentTest: function (teamID, testID) {
			conn.hgetall(teamID, function(err, reply) {
				if (err) 
					throw err;
				
				if (reply) {
					reply.CurrentTest = testID;
					conn.hmset(teamID, reply);
					console.log("reply: ", reply);
				}
			});						
		},
		
		setCurrentScreen: function (teamID, screen) {
			conn.hgetall(teamID, function(err, reply) {
				if (err) 
					throw err;
				
				if (reply) {
					reply.CurrentScreen = screen;
					conn.hmset(teamID, reply);
					console.log("reply: ", reply);
				}
			});						
		},

		getCurrentTest: function(teamID, callback) {
			conn.hgetall(teamID, function(err, reply) {
				if (err) 
					throw err;
				
				if (reply) {
					callback(reply.CurrentTest);
					console.log("reply: ", reply);
				}
			});						
		},
		
		getCurrentScreen: function(teamID, callback) {
			conn.hgetall(teamID, function(err, reply) {
				if (err) 
					throw err;
				
				if (reply) {
					callback(reply.CurrentScreen);
					console.log("reply: ", reply);
				}
			});						
		},
		
		delTeam: function(teamID) {
			conn.del(teamID);
		}
				
	};
};