/**
 * New node file
 */

module.exports = 
{
		installHandlers: function(context) {
			var commons = require('./commons.js')(context);
			var utils = require('./utils')();
			var logger = require('./logger')(context);
			var results = require('./results')(context);
						
	        context.socket.on(GET_TEST_STATE_REQ, function() {
	        	commons.sendTestStateRsp();
	        });
	               
	        context.socket.on(GET_SESSION_STATE_REQ, function() {
	        	commons.sendSessionStateRsp();
	        });
	        
	        context.socket.on(GET_STATE_REQ, function() {
	        	commons.sendStateRsp();
	        });	        
	        
	        context.socket.on(GET_TRANSACTIONS_REQ, function() {
	        	commons.sendTransactions(PIC_COMP);
	        });	        
	                
	        context.socket.on(PERM_REQ, function(op) {
	        	switch (op) {
	        	case LOAD_TEST_PAGE:
	        		commons.checkAllReady(op, PIC_COMP, picCompSetupTestTimer);
	        		break;
	        	case EDIT_TITLE:
	        		commons.checkEditTitle();
	        		break;
	        	}
	        });
	        
	        function picCompSetupTestTimer() {
	    	        commons.setupTestTime(PIC_COMP, picCompTestComplete);
	        }
	                        	        
	        context.socket.on(UPDATE_TITLE_MSG, function(title) {
	        	commons.saveAndBroadcastUpdateTitleMsg(PIC_COMP, title);
	        });
	        	        
	        context.socket.on(DRAW_MSG, function(dot) {
	        	commons.saveAndBroadcastTransaction(DRAW_MSG, PIC_COMP, dot);
	        });
	        
	        context.socket.on(ERASE_MSG, function(dot) {
	        	commons.saveAndBroadcastTransaction(ERASE_MSG, PIC_COMP, dot);
	        });
	        
	        context.socket.on(UNDO_MSG, function(object) {
	        	commons.saveAndBroadcastTransaction(UNDO_MSG, PIC_COMP, object);
	        });
	        
	        context.socket.on(REDO_MSG, function(object) {
	        	commons.saveAndBroadcastTransaction(REDO_MSG, PIC_COMP, object);
	        });
	        
	        context.socket.on(WAIT_MSG, function() {
	        	context.channel.sendToTeam(context.session.TeamID, WAIT_MSG);
	        });
	        	             
	        context.socket.on(DISCONNECT_MSG, function() {
	        	commons.disconnectUser();
	        });	
	        
	        context.socket.on(IS_BACKEND_READY_REQ, function() {
	        	commons.sendIsBackendReadyRsp(PIC_COMP);
	        });

	        context.socket.on(GET_RESULTS_RSP, function(res) {
	        	logger.debug("Results received ...");
	        	results.savePicCompResults(res);
	        	
	        	logger.debug("Redirect team " + context.session.TeamID + " to ", utils.getInstructionURL(utils.getNextTestID(PIC_COMP)));
	        	results.saveParticipants(PIC_COMP, commons.moveToNextTest, PIC_COMP);
	        });
	        
	        context.socket.on(NEXT_SCREEN_MSG, function(res) {
	        	if (res.status == CHANGED)
	        		results.savePicCompResults(res);
	        	context.rdb.setTeam(context.session.TeamID, picCompIncrementScreen, {}, picCompSendChangeScreenMsg);
	        });	        
	        
	        function picCompIncrementScreen(teamInfo) {
	        	teamInfo.CurrentScreen = parseInt(teamInfo.CurrentScreen) + 1;
	        	return teamInfo;
	        }
	        
	        function picCompSendChangeScreenMsg(teamInfo) {
	        	context.channel.sendToTeam(context.session.TeamID, CHANGE_SCREEN_MSG, teamInfo.CurrentScreen);
	        }
	        
	        context.socket.on(PREV_SCREEN_MSG, function(res) {
	        	if (res.status == CHANGED)
	        		results.savePicCompResults(res);
	        	context.rdb.setTeam(context.session.TeamID, picCompDecrementScreen, {}, picCompSendChangeScreenMsg);
	        });	        
	        
	        function picCompDecrementScreen(teamInfo) {
	        	teamInfo.CurrentScreen = parseInt(teamInfo.CurrentScreen) - 1;
	        	return teamInfo;	        	
	        }
	        	        
	        context.socket.on(GET_TEST_INSTRUCTION_REQ, function() {
	        	commons.sendInstructionFile(PIC_COMP);
	        });	        
	        	        	       	              
	        function picCompTestComplete() {
	        	if (DEMO) {
	        		context.rdb.getDemoStopTimer(context.session.TeamID, demoPicCompTestComplete)
	        	} else {
	        		commons.sendTestComplete();
	        		commons.sendGetResultsReq();
	        	}	        		
	        }
	        
	        function demoPicCompTestComplete(timerStatus) {
	        	if (timerStatus == DEMO_TIMER_ACTIVE) {
	        		commons.sendTestComplete();
	        		commons.sendGetResultsReq();	        		
	        	}
	        }
	        
	        context.socket.on(DEMO_STOP_TIMER, function() {
	        	context.rdb.setDemoStopTimer(context.session.TeamID, DEMO_TIMER_INACTIVE);
	        	commons.broadcastTransaction(DEMO_STOP_TIMER, PIC_COMP, {});
	        });
	        
	        context.socket.on(DEMO_NEXT_TEST, function() {
	        	context.rdb.setDemoStopTimer(context.session.TeamID, DEMO_TIMER_ACTIVE);
        		commons.sendTestComplete();
        		commons.sendGetResultsReq();	        		
	        });
	          
	        logger.debug("Hanlders were installed for picture completion test.");	        
		}		
};
