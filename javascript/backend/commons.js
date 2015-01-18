/**
 * New node file
 */

module.exports = function(context)
{
	var logger = require('./logger.js')(context);
	var utils = require('./utils.js')();
	utils.includeConstants('./javascript/backend/constants.js');
	
	return {
		sendTestStateRsp: function() {
			context.rdb.getTeam(context.session.TeamID, sendTestState);
		},
		
		sendSessionStateRsp: function() {
			context.channel.sendToUser(context.session.AccessCode, GET_SESSION_STATE_RSP, context.session);
		},
		
		sendStateRsp: function() {
			context.rdb.getTeam(context.session.TeamID, sendState);
		},
		
		sendTestComplete: function() {
	    	context.channel.sendToTeam(context.session.TeamID, TEST_COMPLETE_MSG);
		},

		sendGetResultsReq: function() {
	    	context.channel.sendToMinID(context.session.TeamID, GET_RESULTS_REQ);
		},
		
		setTestTime: function(time) {
	        context.rdb.setTime(context.session.TeamID, time);
		},
		
		sendBackendReadyMsg: function() {
	        context.channel.sendToUser(context.session.AccessCode, BACKEND_READY_MSG);
		},		
		
		sendIsBackendReadyRsp: function (rsp) {
			context.channel.sendToUser(context.session.AccessCode, IS_BACKEND_READY_RSP, rsp);
		},
				
		setupTestTime: function(testID, callback, args) {
			context.db.getTestTimeLimit(testID, setupTime, callback, args)	     
		},
		
		checkAllReady: function (op, testID, callback, args) {
			context.rdb.getCurrentScreen(context.session.TeamID, checkAllReadyRsp, {op:op, testID: testID, callback: callback, args:args});
		},
		
		checkEditTitle: function() {
			context.rdb.setTextEditingUser(context.session.TeamID, context.session.Name, editTitleRsp);
		},	
		
		saveTransaction: function(testID, data) {
			context.db.saveTransaction(context.session.TeamID, context.session.UserID, testID, data);
		},
		
		broadcastTransaction: function(msg, testID, data) {
        	data.userID = context.session.UserID;
        	context.channel.sendToTeam(context.session.TeamID, msg, data);	        	
		},

		unicastTransaction: function(msg, testID, data) {
        	data.userID = context.session.UserID;
        	context.channel.sendToUser(context.session.AccessCode, msg, data);	        	
		},

		saveAndBroadcastTransaction: function(msg, testID, data) {
        	this.saveTransaction(testID, data);
        	this.broadcastTransaction(msg, testID, data);	        				
		},
		
		sendTransactions: function(testID) {
			context.rdb.getCurrentScreen(context.session.TeamID, sendScreenTransactions, {testID: testID});
		},
		
		sendEndData: function() {
			sendEndDataMsg();
		},
				
		disconnectUser: function () {
			context.channel.leaveTeam(context.session.AccessCode, context.session.TeamID);
			context.channel.disconnect(context.session.AccessCode);
			context.rdb.delParticipant(context.session.TeamID, context.session.AccessCode);
			context.db.deactivateUser(context.session.TeamID, context.session.UserID);
			context.rdb.delReadyParticipant(context.session.TeamID, context.session.AccessCode);
			
			context.db.getActiveUsersCount();			
		},
		
		broadcastUpdateTitleMsg: function(testID, title) {
        	this.broadcastTransaction(UPDATE_TITLE_MSG, testID, title);
        	context.rdb.clearTextEditingUser(context.session.TeamID);			
		},

		saveAndBroadcastUpdateTitleMsg: function(testID, title) {
        	this.saveAndBroadcastTransaction(UPDATE_TITLE_MSG, testID, title);
        	context.rdb.clearTextEditingUser(context.session.TeamID);			
		},
		
		sendInstructionFile: function(testID) {
			sendTestInstruction(testID);
		},		
		
		sendIntroduction: function() {
			context.db.getIntroductionFile(sendIntroduction);
		},
			
		moveToNextTest: function(currentTest) {
			if (currentTest != LAST_TEST) {
    			nextTest = utils.getNextTestID(currentTest);
    			context.rdb.setCurrentTest(context.session.TeamID, nextTest);
    			context.rdb.setCurrentScreen(context.session.TeamID, INSTRUCTION_SCREEN);
    			context.rdb.waitFor(context.session.TeamID, "reply.CurrentTest == '" + nextTest + "' && reply.CurrentScreen == '" + INSTRUCTION_SCREEN + "'", redirectToTest, nextTest);
			}
		}
		
	};

	function redirectToTest(testID) {
		context.channel.sendToTeam(context.session.TeamID, GOTO_MSG, utils.getInstructionURL(testID));
	}

    function sendTestState(teamInfo) {
    	teamInfo.CurrentTime = new Date().getTime();
    	context.channel.sendToUser(context.session.AccessCode, GET_TEST_STATE_RSP, teamInfo);
    }
    
    function sendState(teamInfo) {
    	teamInfo.CurrentTime = new Date().getTime();
    	context.channel.sendToUser(context.session.AccessCode, GET_STATE_RSP, {testState:teamInfo, sessionState:context.session});    	
    }
	
	function setupTime(time, callback, args) {
	    time = 30;
		logger.debug("time for this test is: ", time, " sec");
		context.rdb.setTime(context.session.TeamID, time*1000);
        setTimeout(function() {
        	context.rdb.updateTime(context.session.TeamID, callback, args);
        }, (time+1)*1000);        
	}
	
	function checkAllReadyRsp(currentScreen, args) {
		if (context.session.Late || (args.testID == PRAC_AREA && currentScreen > INSTRUCTION_SCREEN && args.op != START_TEST)) {
			context.channel.sendToUser(context.session.AccessCode, PERM_RSP, 
					{decision:GRANTED, operation:args.op});
			if (args.callback)
				args.callback(args.args);
		} else {
			context.rdb.addReadyParticipant(context.session.TeamID, context.session.AccessCode);
			context.rdb.checkReadyParticipants(context.session.TeamID, checkOtherParticipants, args);
		}
	}
	
	function checkOtherParticipants(allReady, len, args) {
		if (allReady && len >= 2) {
			context.channel.sendToTeam(context.session.TeamID, PERM_RSP, 
					{decision:GRANTED, operation:args.op});
			context.rdb.clearReadyParticipants(context.session.TeamID);
			context.rdb.setCurrentScreen(context.session.TeamID, 1);
			if (args.callback)
				args.callback(args.args)
		}
	}	        
	
	function editTitleRsp(name) {
		if (name != context.session.Name) {
			context.channel.sendToUser(context.session.AccessCode, PERM_RSP, 
					{decision:DECLINED, operation: EDIT_TITLE, info: name});
		} else {
			context.channel.sendToUser(context.session.AccessCode, PERM_RSP, 
					{decision:GRANTED, operation: EDIT_TITLE});
			context.channel.sendToTeam(context.session.TeamID, TITLE_BEING_EDITED_MSG, {editingUser: name});
		}
	}
	
	function sendScreenTransactions(currentScreen, args) {
		context.db.getTransactions(context.session.TeamID, args.testID, currentScreen, sendTransactions);
	}
	
	function sendEndDataMsg() {
		context.channel.sendToUser(context.session.AccessCode, END_DATA_MSG);
	}
    function sendTransactions(rows) {
    	var messageMap = ["", DRAW_MSG, ERASE_MSG, MOVE_SHAPE_MSG, ROTATE_SHAPE_MSG, UPDATE_TITLE_MSG, UNDO_MSG, REDO_MSG];
    	
        for(var i = 0; i<rows.length; i++) {                 	
            context.channel.sendToUser(context.session.AccessCode, utils.getMessage(rows[i].Object, rows[i].Operation), 
            		{userID: rows[i].UserID, screenNumber: rows[i].ScreenNumber, ObjectID: rows[i].Object, 
            		 Operation: rows[i].Operation, OperationData: eval("(" + rows[i].OperationData + ")")}
            );
        }	 
        sendEndDataMsg();        
    }

    function sendTestInstruction(currentTest) {
		context.db.getTestInstructionFile(currentTest, sendInstructionsFile, {msg:GET_TEST_INSTRUCTION_RSP});
    }
    
    function sendIntroduction() {
    	context.db.getIntroductionFile(sendInstructionsFile, {msg:GET_INTRODUCTION_RSP});
    }
    
    function instructionsFormatter(data, timeLimit) {
		var plates = require('plates');
		var tags = { "testtime": parseInt(timeLimit/60), 
					 "usercolour": utils.getUserColor(context.session.UserID)};
		var map = plates.Map();
		map.where('color').has(/uc/).insert('usercolour');
		map.class('time').to('testtime');    		
		return plates.bind(data.toString(), tags, map)
    }
    
    function sendInstructionsFile(fileName, timeLimit, args) {
    	var fs = require('fs');
    	
    	fs.readFile(fileName, function (err, data) {
    		if (err) throw err;

    		context.channel.sendToUser(context.session.AccessCode, args.msg, instructionsFormatter(data, timeLimit));
    	});
    }    
};