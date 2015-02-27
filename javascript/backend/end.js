/**
 * New node file
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
	                
	        context.socket.on(GET_END_PAGE_REQ, function() {
	        	commons.sendEndPage();
	        });	        
	        
	        context.socket.on(DISCONNECT_MSG, function() {
	        	commons.disconnectUser();
	        });

	        context.socket.on(DEMO_RESET_TEAM_STATUS, function() {
	        	context.rdb.resetTeam(context.session.TeamID);
	        	context.db.delTeamInfo(context.session.TeamID);
	        	results.removeResults();
	        });
	        
	        context.socket.on(IS_BACKEND_READY_REQ, function() {
	        	commons.sendIsBackendReadyRsp(END_TEST);
	        });
	        
	        logger.debug("Handlers were installed for end page.");	        
		}		
};