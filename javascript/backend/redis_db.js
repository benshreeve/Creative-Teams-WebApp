/**
 * New node file
 */
module.exports = function (conn) {
	var utils = require("./utils.js")();
	var lock = require('redis-lock')(conn);
	var logger = require('./logger')();
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
					}
					else {
						logger.debug("no record for team " + teamID + ". create one ...");
						conn.hmset(teamID, "CurrentTest", PRAC_AREA, 
									   "CurrentScreen", INSTRUCTION_SCREEN,
									   "TextEditingUser", '',
									   "StartTime", 9999,
									   "TestTime", 0,
									   "IdeaId", 1,
									   "Participants", accessCode,
									   "ReadyToStart", '',
									   "PicConBGCreator", '',
									   "PicConBGCreated", false);
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
					} else {
						logger.debug("no record for team ", teamID);
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
					} else {
						logger.debug("no record for team ", teamID);
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
		
		setPicConBGCreator: function(teamID, accessCode, callback, args) {
			lock(teamID, function(done) {
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done();
						throw err;
					}
					if (reply) {
						if (reply.PicConBGCreator == '') {
							reply.PicConBgCreator = accessCode;
							conn.hmset(teamID, reply);
						}
						
						done();
						
						callback(reply.PicConBgCreator, args);												
					} else
						done();						
				});
			});											
		},
		
		setPicConBGCreated: function(teamID, value) {
			lock(teamID, function(done) {
				conn.hgetall(teamID, function(err, reply) {
					if (err) {
						done();
						throw err;
					}
					
					if (reply) {
						reply.PicConBgCreated = value;
						conn.hmset(teamID, reply);
					}
					
					done();						
					
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