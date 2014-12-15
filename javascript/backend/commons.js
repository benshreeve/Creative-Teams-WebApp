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
		},
		
		checkAllReady: function (op, testID, callback, args) {
			context.rdb.getCurrentScreen(context.session.TeamID, checkAllReadyRsp, {op:op, testID: testID, callback: callback, args:args});
		},
		
		checkEditTitle: function() {
			context.rdb.setTextEditingUser(context.session.TeamID, context.session.Name, editTitleRsp);
		},	
		
		saveTransaction: function(testID, data) {
			context.db.saveTransaction(context.session.TeamID, context.session.UserID, testID, data);
		}
		
	};
	
	function setupTime(time, callback, args) {
	    time = 100;
		console.log("time for this test is: ", time, " sec");
		context.rdb.setTime(context.session.TeamID, time*1000);
        setTimeout(function() {
        	context.rdb.updateTime(context.session.TeamID, callback, args);
        }, (time+1)*1000);        
	}
	
	function checkAllReadyRsp(currentScreen, args) {
		if (context.session.Late || (args.testID == PRAC_AREA && currentScreen > INSTRUCTION_SCREEN)) {
			context.channel.sendToUser(context.session.AccessCode, PERM_RSP, 
					{decision:GRANTED, operation:args.op});
			if (args.callback)
				args.callback(args.args);
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


};