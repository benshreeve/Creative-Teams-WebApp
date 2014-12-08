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
		
		setTestTime: function(time) {
	        context.rdb.setTime(context.session.TeamID, time);
		},
		
		sendBackendReady: function() {
	        context.channel.sendToUser(context.session.AccessCode, "BackendReadyMsg");
		},		
				
		setupTestTime: function(testID, callback, args) {
			context.db.getTestTimeLimit(testID, setupTime, callback, args)	     
		}
		
	};
	
	function setupTime(time, callback, args) {
	//	time = 20;
		console.log("time for this test is: ", time, " sec");
		context.rdb.setTime(context.session.TeamID, time*1000);
        setTimeout(function() {
        	context.rdb.updateTime(context.session.TeamID, callback, args);
        }, (time+1)*1000);        
	}

};