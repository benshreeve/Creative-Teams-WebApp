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
					        
	        context.socket.on(GET_STATE_REQ, function() {
	        	commons.sendStateRsp();
	        });	        
	        
	        context.socket.on(IS_BACKEND_READY_REQ, function() {
	        	commons.sendIsBackendReadyRsp(END_TEST);
	        });
	        
	        context.socket.on(GET_END_PAGE_REQ, function() {
	        	commons.sendEndPage();
	        });	        
	        
	        context.socket.on(DISCONNECT_MSG, function() {
	        	commons.disconnectUser();
	        });		        
	        	        	       	         
	        logger.debug("Hanlders were installed for end page.");	        
		}		
};