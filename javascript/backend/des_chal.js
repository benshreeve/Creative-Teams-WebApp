/**
 * Author: Habib Naderi
 * Department of Computer Science, University of Auckland
 * 
 * This module implements required handlers for the messages which can be received from frontend(s) during Design Challenge Test.
 * installHanlders is called by backend.js to attach handlers to the client's socket.
 */

module.exports = 
{
		installHandlers: function(context) {
			var commons = require('./commons.js')(context);
			var utils = require('./utils')(context);
			var logger = require('./logger')(context);
			var results = require('./results')(context);
					       
	        context.socket.on(GET_STATE_REQ, function() {
	        	commons.sendStateRsp();
	        });	        
	        
	        context.socket.on(GET_TRANSACTIONS_REQ, function() {
	        	commons.sendTransactions(DES_CHAL);
	        });	        
	                
	        context.socket.on(PERM_REQ, function(op) {
	        	switch (op) {
	        	case LOAD_TEST_PAGE:
	        		commons.checkAllReady(op, DES_CHAL, desChalSetupTestTimer);
	        		break;
	        	case EDIT_TITLE:
	        		commons.checkEditTitle();
	        		break;
	        	}
	        });
	        
	        function desChalSetupTestTimer() {
	    	        commons.setupTestTime(DES_CHAL, desChalTestComplete);
	        }
	                        	        
	        context.socket.on(UPDATE_TITLE_MSG, function(title) {
	        	commons.saveAndBroadcastUpdateTitleMsg(DES_CHAL, title);
	        });
	        	        
	        context.socket.on(DRAW_MSG, function(dot) {
	        	commons.saveAndBroadcastTransaction(DRAW_MSG, DES_CHAL, dot);
	        });
	        
	        context.socket.on(ERASE_MSG, function(dot) {
	        	commons.saveAndBroadcastTransaction(ERASE_MSG, DES_CHAL, dot);
	        });
	        
	        context.socket.on(UNDO_MSG, function(object) {
	        	commons.saveAndBroadcastTransaction(UNDO_MSG, DES_CHAL, object);
	        });
	        
	        context.socket.on(REDO_MSG, function(object) {
	        	commons.saveAndBroadcastTransaction(REDO_MSG, DES_CHAL, object);
	        });
	        
	        context.socket.on(WAIT_MSG, function() {
	        	commons.broadcastTransaction(WAIT_MSG, DES_CHAL, {});
	        });
	        	             
	        context.socket.on(DISCONNECT_MSG, function() {
	        	commons.disconnectUser();
	        });	
	        
	        context.socket.on(GET_RESULTS_RSP, function(res) {
	        	results.saveDesChalResults(res);
	        	
	        	logger.debug("Redirect team " + context.session.TeamID + " to ", utils.getInstructionURL(utils.getNextTestID(DES_CHAL)));
	        	results.saveParticipants(DES_CHAL, commons.moveToNextTest, DES_CHAL);
	        });
	        
	        context.socket.on(NEXT_SCREEN_MSG, function(res) {
	        	if (res.status == CHANGED)
	        		results.saveDesChalResults(res);
	        	context.rdb.setTeam(context.session.TeamID, desChalIncrementScreen, {}, desChalSendChangeScreenMsg);
	        });	        
	        
	        function desChalIncrementScreen(teamInfo) {
	        	teamInfo.CurrentScreen = parseInt(teamInfo.CurrentScreen) + 1;
	        	return teamInfo;
	        }
	        
	        function desChalSendChangeScreenMsg(teamInfo) {
	        	context.channel.sendToTeam(context.session.TeamID, CHANGE_SCREEN_MSG, teamInfo.CurrentScreen);
	        }
	        
	        context.socket.on(PREV_SCREEN_MSG, function(res) {
	        	if (res.status == CHANGED)
	        		results.saveDesChalResults(res);
	        	context.rdb.setTeam(context.session.TeamID, desChalDecrementScreen, {}, desChalSendChangeScreenMsg);
	        });	        
	        
	        function desChalDecrementScreen(teamInfo) {
	        	teamInfo.CurrentScreen = parseInt(teamInfo.CurrentScreen) - 1;
	        	return teamInfo;	        	
	        }
	        	        
	        context.socket.on(GET_TEST_INSTRUCTION_REQ, function() {
	        	commons.sendInstructionFile(DES_CHAL);
	        });	        
            
	        context.socket.on(NOTIFY_TEAM_MSG, function(msg) {
	        	commons.broadcastTransaction(NOTIFY_TEAM_MSG, DES_CHAL, msg);	        	
	        });	        
	        	        	       	              	        	        	        	       	              	        	        	       	              
	        function desChalTestComplete() {
	        	if (DEMO) {
	        		context.rdb.getDemoStopTimer(context.session.TeamID, demoDesChalTestComplete)
	        	} else {
	        		commons.sendTestComplete();
	        		commons.sendGetResultsReq();
	        	}	        		
	        }
	        
	        function demoDesChalTestComplete(timerStatus) {
	        	if (timerStatus == DEMO_TIMER_ACTIVE) {
	        		commons.sendTestComplete();
	        		commons.sendGetResultsReq();	        		
	        	}
	        }
	        
	        context.socket.on(DEMO_STOP_TIMER, function() {
	        	context.rdb.setDemoStopTimer(context.session.TeamID, DEMO_TIMER_INACTIVE);
	        	commons.broadcastTransaction(DEMO_STOP_TIMER, DES_CHAL, {});
	        });
	        
	        context.socket.on(DEMO_NEXT_TEST, function() {
	        	context.rdb.setDemoStopTimer(context.session.TeamID, DEMO_TIMER_ACTIVE);
        		commons.sendTestComplete();
        		commons.sendGetResultsReq();	        		
	        });
	        
	        // should be the last one to ensure frontend that the backend is completely ready.
	        context.socket.on(IS_BACKEND_READY_REQ, function() {
	        	commons.sendIsBackendReadyRsp(DES_CHAL);
	        });
	        
	          
	        logger.debug("Hanlders were installed for design challenge test.");	        
		}		
};