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
	        	commons.sendTransactions(PAR_LINES);
	        });	        
	                
	        context.socket.on(PERM_REQ, function(op) {
	        	switch (op) {
	        	case LOAD_TEST_PAGE:
	        		commons.checkAllReady(op, PAR_LINES, parLinesSetupTestTimer);
	        		break;
	        	case EDIT_TITLE:
	        		commons.checkEditTitle();
	        		break;
	        	}
	        });
	        
	        function parLinesSetupTestTimer() {
	    	        commons.setupTestTime(PAR_LINES, parLinesTestComplete);
	        }
	                        	        
	        context.socket.on(UPDATE_TITLE_MSG, function(title) {
	        	commons.saveAndBroadcastUpdateTitleMsg(PAR_LINES, title);
	        });
	        	        
	        context.socket.on(DRAW_MSG, function(dot) {
	        	commons.saveAndBroadcastTransaction(DRAW_MSG, PAR_LINES, dot);
	        });
	        
	        context.socket.on(ERASE_MSG, function(dot) {
	        	commons.saveAndBroadcastTransaction(ERASE_MSG, PAR_LINES, dot);
	        });
	        
	        context.socket.on(UNDO_MSG, function(object) {
	        	commons.saveAndBroadcastTransaction(UNDO_MSG, PAR_LINES, object);
	        });
	        
	        context.socket.on(REDO_MSG, function(object) {
	        	commons.saveAndBroadcastTransaction(REDO_MSG, PAR_LINES, object);
	        });
	        
	        context.socket.on(WAIT_MSG, function() {
	        	context.channel.sendToTeam(context.session.TeamID, WAIT_MSG);
	        });
	        	             
	        context.socket.on(DISCONNECT_MSG, function() {
	        	commons.disconnectUser();
	        });	
	        
	        context.socket.on(IS_BACKEND_READY_REQ, function() {
	        	commons.sendIsBackendReadyRsp(PAR_LINES);
	        });

	        context.socket.on(GET_RESULTS_RSP, function(res) {
	        	results.saveParLinesResults(res);
	        	
	        	logger.debug("Redirect team " + context.session.TeamID + " to ", utils.getInstructionURL(utils.getNextTestID(PAR_LINES)));
	        	results.saveParticipants(PAR_LINES, commons.moveToNextTest, PAR_LINES);
	     //   	commons.moveToNextTest(PAR_LINES);
	        });
	        
	        context.socket.on(NEXT_SCREEN_MSG, function(res) {
	        	if (res.status == CHANGED)
	        		results.saveParLinesResults(res);
	        	context.rdb.setTeam(context.session.TeamID, parLinesIncrementScreen, {}, parLinesSendChangeScreenMsg);
	        });	        
	        
	        function parLinesIncrementScreen(teamInfo) {
	        	teamInfo.CurrentScreen = parseInt(teamInfo.CurrentScreen) + 1;
	        	return teamInfo;
	        }
	        
	        function parLinesSendChangeScreenMsg(teamInfo) {
	        	context.channel.sendToTeam(context.session.TeamID, CHANGE_SCREEN_MSG, teamInfo.CurrentScreen);
	        }
	        
	        context.socket.on(PREV_SCREEN_MSG, function(res) {
	        	if (res.status == CHANGED)
	        		results.saveParLinesResults(res);
	        	context.rdb.setTeam(context.session.TeamID, parLinesDecrementScreen, {}, parLinesSendChangeScreenMsg);
	        });	        
	        
	        function parLinesDecrementScreen(teamInfo) {
	        	teamInfo.CurrentScreen = parseInt(teamInfo.CurrentScreen) - 1;
	        	return teamInfo;	        	
	        }
	        	        
	        context.socket.on(GET_TEST_INSTRUCTION_REQ, function() {
	        	commons.sendInstructionFile(PAR_LINES);
	        });	        
	        	        	       	              
	        function parLinesTestComplete() {
	        	commons.sendTestComplete();
	        	commons.sendGetResultsReq();	        	
	        }
	          
	        logger.debug("Hanlders were installed for parallel lines test.");	        
		}		
};