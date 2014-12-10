/**
 * New node file
 */
module.exports = function (conn) {
	var utils = require("./utils.js")();
	var lock = require('redis-lock')(conn);
//	var constants = require('./constants');
	utils.includeConstants('./javascript/backend/constants.js');
	return {
		addParticipant: function(teamID, accessCode) {
			lock(teamID, function(done) {			
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done();
						throw err;
					}
				
					if (reply) {
						reply.Participants = utils.addItemUnique(reply.Participants, accessCode);
						conn.hmset(teamID, reply);
						//console.log("reply: ", reply);
					}
					else {
						console.log("no record for this team. create one ...");
						conn.hmset(teamID, "CurrentTest", PRAC_AREA, 
									   "CurrentScreen", INSTRUCTION_SCREEN,
									   "TextEditingUser", '',
									   "StartTime", 9999,
									   "TestTime", 0,
									   "IdeaId", 1,
									   "Participants", accessCode,
									   "ReadyToStart", '');
					}
					done();
				});
			});
		},
		
		delParticipant: function(teamID, accessCode) {
			lock(teamID, function(done){
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done();
						throw err;
					}
				
					if (reply) {
						reply.Participants = utils.delItem(reply.Participants, accessCode);
						conn.hmset(teamID, reply);
						//console.log("reply: ", reply);
					} else {
						console.log("no record for this team");
					}
					done();
				});
			});
		},

		
		clearParticipants: function(teamID) {
			lock(teamID, function(done){
				conn.hgetall(teamID, function(err, reply) {
					if (err) { 
						done();
						throw err;
					}
				
					if (reply) {
						reply.Participants = '';
						conn.hmset(teamID, reply);
						//	console.log("reply: ", reply);
					}
					done();
				});
			});
		},
		

		addReadyParticipant: function(teamID, accessCode) {
			lock(teamID, function(done) {
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done();
						throw err;
					}
				
					if (reply) {
						reply.ReadyToStart = utils.addItemUnique(reply.ReadyToStart, accessCode);
						conn.hmset(teamID, reply);
						//console.log("reply: ", reply);
					}
					done();
				});
			});
		},
		
		delReadyParticipant: function(teamID, accessCode) {
			lock(teamID, function(done){
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done();
						throw err;
					}
				
					if (reply) {
						reply.ReadyToStart = utils.delItem(reply.ReadyToStart, accessCode);
						conn.hmset(teamID, reply);
						//console.log("reply: ", reply);
					} else {
						console.log("no record for this team");
					}
					done();
				});
			});
		},
		
		
		checkReadyParticipants: function(teamID, callback, args) {
			lock(teamID, function(done) {
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done();
						throw err;
					}
					
					done();
					
					if (reply) {
						callback(utils.isEqual(reply.Participants, reply.ReadyToStart), utils.getLength(reply.ReadyToStart), args);
					}

				});
			});			
		},
		
		clearReadyParticipants: function(teamID) {
			lock(teamID, function(done) {
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done();
						throw err;
					}
				
					if (reply) {
						reply.ReadyToStart = '';
						conn.hmset(teamID, reply);
						//console.log("reply: ", reply);
					}
					done();
				});
			});
		},
		
		setTextEditingUser: function(teamID, name, callback, args) {
			lock(teamID, function(done) {
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done()
						throw err;
					}
				
					if (reply) {
						if (reply.TextEditingUser == '') {
							reply.TextEditingUser = name;
							conn.hmset(teamID, reply);
						}
						done();
						callback(reply.TextEditingUser);
					} else
						done();
				});
			});
		},
		
		clearTextEditingUser: function(teamID) {
			lock(teamID, function(done) {
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done()
						throw err;
					}
				
					if (reply) {
						reply.TextEditingUser = '';
						conn.hmset(teamID, reply);
					}
					
					done();
				});
			});
		},
		
		getTextEditingUser: function(teamID, callback, args) {
			lock(teamID, function(done) {
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done()
						throw err;
					}
				
					if (reply) {
						callback(reply.TextEditingUser, args);
						//console.log("reply: ", reply);
					}
					done();
				});
			});
		},
		
		
		setIdeaID: function(teamID, ideaID) {
			lock(teamID, function(done) {
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done();
						throw err;
					}
				
					if (reply) {
						reply.IdeaId = ideaID;
						conn.hmset(teamID, reply);
						//console.log("reply: ", reply);
					}
					done();
				});
			});
		},
		
		getIdeaID: function(teamID, callback, args) {
			lock(teamID, function(done) {
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done();
						throw err;
					}
				
					if (reply) {
						callback(reply.IdeaId, args);
						//console.log("reply: ", reply);
					}
					done();
				});			
			});
		},

		genIdeaID: function(teamID, callback, args) {
			lock(teamID, function(done) {
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done();
						throw err;
					}
				
					if (reply) {
						var id = reply.IdeaId ++;
						conn.hmset(teamID, reply);
						done();
						callback(id, args);
						//console.log("reply: ", reply);
					} else 
						done();
				});
			});
		},
		
		setCurrentTest: function (teamID, testID) {
			lock(teamID, function(done) {
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done();
						throw err;
					}
				
					if (reply) {
						reply.CurrentTest = testID;
						conn.hmset(teamID, reply);
						//console.log("reply: ", reply);
					}
					done();
				});
			});
		},
		
		setCurrentScreen: function (teamID, screen) {
			lock(teamID, function(done) {
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done();
						throw err;
					}
				
					if (reply) {
						reply.CurrentScreen = screen;
						conn.hmset(teamID, reply);
						//console.log("reply: ", reply);
					}
					done();
				});
			});
		},

		getCurrentTest: function(teamID, callback, args) {
			lock(teamID, function(done) {
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done();
						throw err;
					}
				
					done();
					
					if (reply) {
						callback(reply.CurrentTest, args);
						//console.log("reply: ", reply);
					} else {
						callback(0, args);
					}
					
				});
			});
		},
		
		getCurrentScreen: function(teamID, callback, args) {
			lock(teamID, function(done) {
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done();
						throw err;
					}
				
					done();
					
					if (reply) {
						callback(reply.CurrentScreen, args);
						//console.log("reply: ", reply);
					} else {
						callback(1);
					}
				});
			});
		},
		
		updateTime: function (teamID, callback, args) {
			lock(teamID, function(done) {
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done();
						throw err;
					}
				
					if (reply) {
						currentTime = new Date().getTime();
						if ((reply.StartTime != 9999) && (currentTime >= parseInt(reply.StartTime) + parseInt(reply.TestTime))) {
							reply.StartTime = 9999;
							reply.TestTime = 0;
							conn.hmset(teamID, reply);
							done();
							callback(args);
						} else
							done();
					} else
						done();
				});
			});
		},
		
		setTime: function(teamID, testTime) {
			lock(teamID, function(done) {
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done();
						throw err;
					}
				
					if (reply) {
						reply.StartTime = new Date().getTime();
						reply.TestTime = testTime;
						conn.hmset(teamID, reply);
					}
					
					done();
				});
			});			
		},
		
		getTeam: function(teamID, callback, args) {
			lock(teamID, function(done) {
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done();
						throw err;
					}
				
					done();
					
					callback(reply, args);					
				});
			});						
		},
		
		delTeam: function(teamID) {
			lock(teamID, function(done) {
				conn.del(teamID);
				done();
			});
		},
		
		updateTimes: function() {
			lock()
		}
	};
};