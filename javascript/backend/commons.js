/**
 * Author: Habib Naderi
 * Department of Computer Science, University of Auckland
 * 
 * This module implements a set of methods which are common (e.g. sending response messages, setting up timers, ...) and useful in implementing 
 * other modules. 
 */
 
module.exports = function(context)
{
	var logger = require('./logger.js')(context);
	var utils = require('./utils.js')(context);
	utils.includeConstants('./javascript/backend/constants.js');
	
	return {
		// sends response to 'GET_TEST_STATE_REQ'.
		sendTestStateRsp: function() {
			context.rdb.getTeam(context.session.TeamID, sendTestState);
		},

		// sends response to 'GET_SESSION_STATE_REQ'.
		sendSessionStateRsp: function() {
			context.channel.sendToUser(context.session.AccessCode, GET_SESSION_STATE_RSP, context.session);
		},
		
		// sends response to 'GET_STATE_REQ'. The response contains both test and session states.
		sendStateRsp: function() {
			context.rdb.getTeam(context.session.TeamID, sendState);
		},
		
		// sends a TEST_COMPLETE_MSG to a team. This message tells frontend(s) that the time for current test
		// is over.
		sendTestComplete: function() {
	    	context.channel.sendToTeam(context.session.TeamID, TEST_COMPLETE_MSG);
		},

		// sends a GET_RESULTS_REQ to the member with minimum user ID in a team. The receiver should collect results for 
		// the test and sends them back to the backend using GET_RESULTS_RSP.
		sendGetResultsReq: function() {
	    	context.channel.sendToMinID(context.session.TeamID, GET_RESULTS_REQ);
		},
		
		// sets test time in the team's record in REDIS db record.
		setTestTime: function(time) {
	        context.rdb.setTime(context.session.TeamID, time);
		},
		
		sendBackendReadyMsg: function() {
	        context.channel.sendToUser(context.session.AccessCode, BACKEND_READY_MSG);
		},		
		
		// sends response to IS_BACKEND_READY_REQ. When a new page is loaded by the frontend, it should wait
		// for the backend to install required handlers for the test. Using IS_BACKEND_READY_REQ, frotnend can
		// check whether the backend is ready.
		sendIsBackendReadyRsp: function (rsp) {
			context.channel.sendToUser(context.session.AccessCode, IS_BACKEND_READY_RSP, rsp);
		},
		
		// retrieves test time from sql DB and then calls callback. It is mostly used by test handlers for setting up a
		// timer which expires when the test time is over.
		setupTestTime: function(testID, callback, args) {
			context.db.getTestTimeLimit(testID, setupTime, callback, args)	     
		},
		
		// Checks if all team members are ready to do something. It is used in the cases that systems needs confirmation
		// from all team members; e.g. starting a test.
		checkAllReady: function (op, testID, callback, args) {
			context.rdb.getCurrentScreen(context.session.TeamID, checkAllReadyRsp, {op:op, testID: testID, callback: callback, args:args});
		},
		
		// Checks if a user is allowed to edit title. Title can be edited by only one user at a time.
		checkEditTitle: function() {
			context.rdb.setTextEditingUser(context.session.TeamID, context.session.Name, editTitleRsp);
		},	
		
		// saves a transaction (data) in mysql DB (table transactions).
		saveTransaction: function(testID, data) {
			context.db.saveTransaction(context.session.TeamID, context.session.UserID, testID, data);
		},
		
		// broadcasts a transaction to a team. msg specifies the message and data contains the transaction data. 
		broadcastTransaction: function(msg, testID, data) {
        	data.userID = context.session.UserID;
        	context.channel.sendToTeam(context.session.TeamID, msg, data);	        	
		},

		// sends a transaction to a specific user. msg specifies the message and data contains the transaction data.
		unicastTransaction: function(msg, testID, data) {
        	data.userID = context.session.UserID;
        	context.channel.sendToUser(context.session.AccessCode, msg, data);	        	
		},

		// saves a transaction in mysql DB and also broadcasts it to the team. msg specifies the message and data contains the transaction data.
		saveAndBroadcastTransaction: function(msg, testID, data) {
        	this.saveTransaction(testID, data);
        	this.broadcastTransaction(msg, testID, data);	        				
		},
		
		// retrieves transactions for a specific test and screen (current screen) from mysql DB and sends it to a
		// specific user. It is usually used in response to GET_TRANSACTRIONS_REQ. 
		sendTransactions: function(testID) {
			context.rdb.getCurrentScreen(context.session.TeamID, sendScreenTransactions, {testID: testID});
		},
		
		// sends END_DATA_MSG to notify the frontend that there is no more transaction in the DB.
		sendEndData: function() {
			sendEndDataMsg();
		},
				
		// It performs required cleanup operations when a user gets disconnected from the system. 
		disconnectUser: function () {
			context.session.refCount --;
			context.session.save();
			if (context.session.refCount == 0) { 			
				//	context.channel.leaveTeam(context.session.AccessCode, context.session.TeamID);
				context.channel.disconnect(context.session.AccessCode);
				context.rdb.delParticipant(context.session.TeamID, context.session.AccessCode);
				context.db.deactivateUser(context.session.TeamID, context.session.UserID);
				//	context.rdb.delReadyParticipant(context.session.TeamID, context.session.AccessCode);
			} else
				console.error(context.session.AccessCode +":DISconnect:refCount:", context.session.refCount);
			
			context.db.getActiveUsersCount("disconnect: ");			
		},
		
		// boradcasts an UPDATE_TITLE_MSG to the team when a user finished updating the title.
		broadcastUpdateTitleMsg: function(testID, title) {
        	this.broadcastTransaction(UPDATE_TITLE_MSG, testID, title);
        	context.rdb.clearTextEditingUser(context.session.TeamID);			
		},
		
		// save an UPDATE_TITLE_MSG transaction in the DB and also broadcasts to the team.
		saveAndBroadcastUpdateTitleMsg: function(testID, title) {
        	this.saveAndBroadcastTransaction(UPDATE_TITLE_MSG, testID, title);
        	context.rdb.clearTextEditingUser(context.session.TeamID);			
		},

	    /* processes an instruction file (located in instructions/) and sends it to forntend.
		 *
	     * instruction files are HTML files which are processed by backend before sending to the frontend. A new 
	     * tag (<tag class="time"></tag>) and a new values for color in font tag (<font id="colour" color="uc">)
	     * have been added.
	     * 'time' can be used to display test time and 'uc' can be used to display a text in user's color. 
	     * Look at instructions/PracArea.html as an example.
	     */ 
		
		sendInstructionFile: function(testID) {
			sendTestInstruction(testID);
		},		
		
	    // processes introduction (instructions/Introduction.html) and sends it to forntend.		
		sendIntroduction: function() {
			context.db.getIntroductionFile(sendIntroduction);
		},
		
	    // processes content of last page (instructions/End.html) and sends it to forntend.		
		sendEndPage: function() {
			context.db.getIntroductionFile(sendEndPage);
		},
			
		// finds next test that should be taken by the team, updated team's record in REDIS DB and sends GOTO_MSG to the 
		// team members with a proper URL after it makes sure the DB got updated. 
		moveToNextTest: function(currentTest) {
			if (currentTest != LAST_TEST) {
    			nextTest = utils.getNextTestID(currentTest);
    			context.rdb.setCurrentTest(context.session.TeamID, nextTest);
    			context.rdb.setCurrentScreen(context.session.TeamID, INSTRUCTION_SCREEN);
    			//context.rdb.waitFor(context.session.TeamID, "reply.CurrentTest == '" + nextTest + "' && reply.CurrentScreen == '" + INSTRUCTION_SCREEN + "'", redirectToTest, nextTest);
    			context.rdb.waitFor2(context.session.TeamID, checkTestAndScreenID, {testID: nextTest, screen: INSTRUCTION_SCREEN}, redirectToTest, nextTest);
    			context.rdb.clearTextEditingUser(context.session.TeamID);
			}
		}
		
	};
	
	// callback methods used in above interface methods.
	
	function checkTestAndScreenID(teamInfo, args) {
		return teamInfo.CurrentTest == args.testID && teamInfo.CurrentScreen == args.screen;
	}

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
		if (DEMO)
			time = DEMO_TEST_TIME;
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
			if (args.callback) {
				if (args.args)
					args.args.startTimer = false;
				args.callback(args.args);
			}
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

    function sendEndPage() {
    	context.db.getEndPageFile(sendInstructionsFile, {msg:GET_END_PAGE_RSP});
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