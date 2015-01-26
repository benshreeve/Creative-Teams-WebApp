/**
 * New node file
 */

module.exports = 
{
		installHandlers: function(context) {
			var commons = require('./commons.js')(context);
			var utils = require('./utils')();
			var logger = require('./logger')(context);
			utils.includeConstants('./javascript/backend/constants.js');
			
	        context.socket.on(GET_TEST_STATE_REQ, function() {
	        	commons.sendTestStateRsp();
	        });
	        	        
	        context.socket.on(GET_SESSION_STATE_REQ, function() {
	        	commons.sendSessionStateRsp();
	        });

	        context.socket.on(GET_STATE_REQ, function() {
	        	commons.sendStateRsp();
	        });
	        
	        context.socket.on(PERM_REQ, function(op) {
	        	switch (op) {
	        	case LOAD_TEST_PAGE:
	        		commons.checkAllReady(op, PRAC_AREA, !context.session.Late ? pracAreaSetupTestTimer: undefined, {startTimer: true});
	        		break;
	        	case START_TEST:
	        		commons.checkAllReady(op, PRAC_AREA, pracAreaStartTest);
	        		break;
	        	case EDIT_TITLE:
	        		if (!context.session.Late)
	        			commons.checkEditTitle();
	        		else
	        			context.channel.sendToUser(context.session.AccessCode, PERM_RSP, {operation: op, decision:GRANTED});
	        	}
	        });
	        
	        function pracAreaSetupTestTimer(args) {
	        	if (args.startTimer)
	    	        commons.setupTestTime(PRAC_AREA, pracAreaTestComplete);
	        }
	        
	        function pracAreaStartTest() {
	        	if (context.session.Late) {
	        		context.rdb.getCurrentTest(context.session.TeamID, pracAreaJoinLateParticipant)
	        	} else {
	        		commons.moveToNextTest(PRAC_AREA);
	        	}
	        }
	        	        
	        function pracAreaJoinLateParticipant(currentTest) {
	        	context.session.Late = false;
	        	context.session.save();
//	        	context.rdb.getCurrentScreen(context.session.TeamID, pracAreaSendTestURL, {currentTest: currentTest});
	        	context.rdb.getTeam(context.session.TeamID, pracAreaSendTestURL);
	        }
	        /*
	        function pracAreaSendTestURL(currentScreen, args) {
	        	context.channel.sendToUser(context.session.AccessCode, GOTO_MSG, 
	        			currentScreen == INSTRUCTION_SCREEN ? utils.getInstructionURL(args.currentTest) : utils.getTestURL(args.currentTest));
	        }
	        */
	        
	        function pracAreaSendTestURL(teamInfo) {	        	
	        	if (teamInfo.CurrentScreen == INSTRUCTION_SCREEN)
		        	context.channel.sendToUser(context.session.AccessCode, GOTO_MSG, utils.getInstructionURL(teamInfo.CurrentTest));
	        	else {	        		
	        		currentTime = new Date().getTime();
	        		if ((currentTime >= parseInt(teamInfo.StartTime) + parseInt(teamInfo.TestTime)) && (teamInfo.DemoStopTimer == DEMO_TIMER_ACTIVE)) {
	        			context.channel.joinTeam(context.session.AccessCode, context.session.TeamID);
	        			commons.moveToNextTest(parseInt(teamInfo.CurrentTest)); 
	        		} else {
	        			context.channel.sendToUser(context.session.AccessCode, GOTO_MSG, utils.getTestURL(teamInfo.CurrentTest));
	        		}
	        	}	        		        			        	
	        }
	        
	        
	        context.socket.on(UPDATE_TITLE_MSG, function(title) {
	        	if (!context.session.Late)
	        		commons.broadcastUpdateTitleMsg(PRAC_AREA, title);
	        });
	        
	        
	        context.socket.on(DRAW_MSG, function(dot) {
	        	if (context.session.Late)
	        		commons.unicastTransaction(DRAW_MSG, PRAC_AREA, dot);
	        	else
	        		commons.broadcastTransaction(DRAW_MSG, PRAC_AREA, dot);
	        });
	        
	        context.socket.on(ERASE_MSG, function(dot) {
	        	if (context.session.Late)
	        		commons.unicastTransaction(ERASE_MSG, PRAC_AREA, dot);
	        	else
	        		commons.broadcastTransaction(ERASE_MSG, PRAC_AREA, dot);
	        });

	        context.socket.on(UNDO_MSG, function(object) {
	        	if (context.session.Late)
	        		commons.unicastTransaction(UNDO_MSG, PRAC_AREA, object);
	        	else
	        		commons.broadcastTransaction(UNDO_MSG, PRAC_AREA, object);
	        });

	        context.socket.on(REDO_MSG, function(object) {
	        	if (context.session.Late)
	        		commons.unicastTransaction(REDO_MSG, PRAC_AREA, object);
	        	else
	        		commons.broadcastTransaction(REDO_MSG, PRAC_AREA, object);
	        });
	        
	        context.socket.on(DISCONNECT_MSG, function(){
	        	commons.disconnectUser();
	        });	
	                
	        context.socket.on(GET_TEST_INSTRUCTION_REQ, function() {
	        	commons.sendInstructionFile(PRAC_AREA);
	        });

	        context.socket.on(GET_INTRODUCTION_REQ, function() {
	        	commons.sendIntroduction();
	        });
	                
	        function pracAreaTestComplete() {
	        	commons.sendTestComplete();
	        }
	        
	        context.socket.on(IS_BACKEND_READY_REQ, function() {
	        	commons.sendIsBackendReadyRsp(PRAC_AREA);
	        });
	        	                       
	        logger.debug("Hanlders were installed for practice area.");
	        
		}		
};