/**
 * New node file
 */

module.exports = function(context)
{
	return {
		sendTestComplete: function() {
	    	context.channel.sendToTeam(context.session.TeamID, 'TestCompleteMsg');
		},

		sendGetResultsReq: function() {
	    	context.channel.sendToMinID(context.session.TeamID, 'GetResultsReq');
		},
		
		setTestTime: function() {
	        context.rdb.setTime(context.session.TeamID, 10000);
		},
		
		sendBackendReady: function() {
	        context.channel.sendToUser(context.session.AccessCode, "BackendReadyMsg");
		},		
		
		setupTestTimer: function(callback, args) {
	        var timer = setInterval(function() {
	        	context.rdb.updateTime(context.session.TeamID, callback, args);
	        }, 2*1000);			
	        return timer;
		}
		
	};	
};