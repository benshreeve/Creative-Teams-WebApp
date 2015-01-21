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
	        	commons.sendTransactions(IDEA_GEN);
	        });	        
	                
	        context.socket.on(PERM_REQ, function(op) {
	        	switch (op) {
	        	case LOAD_TEST_PAGE:
	        		commons.checkAllReady(op, IDEA_GEN, ideaGenSetupTestTimer);
	        		break;
	        	}
	        });
	        
	        function ideaGenSetupTestTimer() {
	    	        commons.setupTestTime(IDEA_GEN, ideaGenTestComplete);
	        }
	        
	        context.socket.on(ADD_IDEA_MSG, function(idea) {
	        	context.rdb.genIdeaID(context.session.TeamID, ideaGenAddMsg, idea);
	        });
	        
	        function ideaGenAddMsg(id, idea) {
	        	idea.OperationData.id = id;
	        	commons.saveAndBroadcastTransaction(ADD_IDEA_MSG, IDEA_GEN, idea);
	        }

	        context.socket.on(DEL_IDEA_MSG, function(idea) {
	        	commons.saveAndBroadcastTransaction(DEL_IDEA_MSG, IDEA_GEN, idea);
	        });

	        context.socket.on(UPDATE_IDEA_MSG, function(idea) {
	        	commons.saveAndBroadcastTransaction(UPDATE_IDEA_MSG, IDEA_GEN, idea);
	        });
	        
	        context.socket.on(DISCONNECT_MSG, function() {
	        	commons.disconnectUser();
	        });	
	        
	        context.socket.on(IS_BACKEND_READY_REQ, function() {
	        	commons.sendIsBackendReadyRsp(IDEA_GEN);
	        });

	        context.socket.on(GET_RESULTS_RSP, function(res) {
	        	results.saveIdeaGenResults(res);
	        	
	        	logger.debug("Redirect team " + context.session.TeamID + " to ", utils.getInstructionURL(utils.getNextTestID(IDEA_GEN)));
	        	results.saveParticipants(IDEA_GEN, commons.moveToNextTest, IDEA_GEN);
	        });
	        	        	        
	        context.socket.on(GET_TEST_INSTRUCTION_REQ, function() {
	        	commons.sendInstructionFile(IDEA_GEN);
	        });	        
	        	        	       	              
	        function ideaGenTestComplete() {
	        	if (DEMO) {
	        		context.rdb.getDemoStopTimer(context.session.TeamID, demoIdeaGenTestComplete)
	        	} else {
	        		commons.sendTestComplete();
	        		commons.sendGetResultsReq();
	        	}	        		
	        }
	        
	        function demoIdeaGenTestComplete(timerStatus) {
	        	if (timerStatus == DEMO_TIMER_ACTIVE) {
	        		commons.sendTestComplete();
	        		commons.sendGetResultsReq();	        		
	        	}
	        }
	        
	        context.socket.on(DEMO_STOP_TIMER, function() {
	        	context.rdb.setDemoStopTimer(context.session.TeamID, DEMO_TIMER_INACTIVE);
	        	commons.broadcastTransaction(DEMO_STOP_TIMER, IDEA_GEN, {});
	        });
	        
	        context.socket.on(DEMO_NEXT_TEST, function() {
	        	context.rdb.setDemoStopTimer(context.session.TeamID, DEMO_TIMER_ACTIVE);
        		commons.sendTestComplete();
        		commons.sendGetResultsReq();	        		
	        });
	          
	        logger.debug("Hanlders were installed for idea generation test.");	        
		}		
};