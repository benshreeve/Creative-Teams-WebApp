/**
 * New node file
 */

module.exports = 
{
		installHandlers: function(context) {
			var commons = require('./commons.js')(context);
	        var constants = require('./constants.js');
			
	        context.socket.on(constants.GET_TEST_STATE_REQ, function() {
	        	context.rdb.getTeam(context.session.TeamID, sendTestState);
	        });
	        
	        function sendTestState(teamInfo) {
	        	context.channel.sendToUser(context.session.AccessCode, constants.GET_TEST_STATE_RSP, teamInfo);
	        }
	        
	        context.socket.on(constants.GET_SESSION_STATE_REQ, function() {
	        	context.channel.sendToUser(context.session.AccessCode, constants.GET_SESSION_STATE_RSP, context.session);
	        });
	        
        
	        context.socket.on(constants.PERM_REQ, function(op) {
	        	switch (op) {
	        	case constants.LOAD_PRACTICE_AREA_PAGE:
	        		context.rdb.addReadyParticipant(context.session.TeamID, context.session.AccessCode);
	        		context.rdb.checkReadyParticipants(context.session.TeamID, loadPracAreaRsp);
	        		break;
	        	case constants.EDIT_TITLE:
	        		context.rdb.setTextEditingUser(context.session.TeamID, context.session.Name, editTitleRsp);
	        	}
	        });
	        
	        function loadPracAreaRsp(allReady, len) {
	        	if (allReady && len >= 2) {
	        		context.channel.sendToTeam(context.session.TeamID, constants.PERM_RSP, 
	        				{decision:constants.GRANTED, operation:constants.LOAD_PRACTICE_AREA_PAGE});
	        		context.rdb.clearReadyParticipants(context.session.TeamID);
	        	}
	        }	        
	        
	        function editTitleRsp(name) {
	        	if (name != context.session.Name) {
	        		context.channel.sendToUser(context.session.AccessCode, constants.PERM_RSP, 
	        				{decision:constants.DECLINED, operation: constants.EDIT_TITLE, info: name});
	        	} else {
	        		context.channel.sendToUser(context.session.AccessCode, constants.PERM_RSP, 
	        				{decision:constants.GRANTED, operation: constants.EDIT_TITLE});
	        		context.channel.sendToTeam(context.session.TeamID, constants.TITLE_BEING_EDITED_MSG, {editingUser: name});
	        	}
	        }
	        
	        context.socket.on(constants.UPDATE_TITLE_MSG, function(title) {
	        	context.channel.sendToTeam(context.session.TeamID, constants.UPDATE_TITLE_MSG, title);
	        	context.rdb.clearTextEditingUser(context.session.TeamID);
	        });
	        
	        
	        context.socket.on(constants.DRAW_MSG, function(dot) {
	        	
	        });
	        
	        context.socket.on(constants.ERASE_MSG, function(dot) {
	        	
	        });
	        
	        context.socket.on('mousedot', function(dot){
	            context.channel.sendToTeam(context.session.TeamID, 'mousedot', dot);
	            // Post to the database here:				
//	            dot.drag ? context.db.drawDot(dot) : context.db.eraseDot(dot);				
	        });
	        

	        // On client disconnection, update the database:
	        context.socket.on(constants.DISCONNECT_MSG, function(){
				context.db.deactivateUser(context.session.TeamID, context.session.UserID);
				context.db.getActiveUsersCount();
				context.rdb.delParticipant(context.session.TeamID, context.session.AccessCode);
				context.channel.leaveTeam(context.session.AccessCode, context.session.TeamID);
				context.channel.disconnect(context.session.AccessCode);
	        });	
	        
	        // When a client requests its session:
	        context.socket.on(constants.IS_BACKEND_READY_REQ, function() {
	        	context.channel.sendToUser(context.session.AccessCode, constants.IS_BACKEND_READY_RSP, constants.READY);
	        });
	        	       	       
	        commons.sendBackendReady();	        
	        commons.setupTestTime(constants.PIC_COMP, testComplete);
	        
	        function testComplete() {
	        	commons.sendTestComplete();
	        }
	                       
	        console.log("Hanlders were installed for practice area.");
	        
	        
	        // When a client requests its session:
	        context.socket.on('requestSession', function() {
	            context.channel.sendToUser(context.session.AccessCode, 'sessionRequest', 
	            			    {sessionColor: utils.getUserColor(context.session.UserID), 
	            				 sessionGroup: context.session.TeamID,
	            				 sessionAccessCode: context.session.AccessCode,
	            				 sessionMinScreen: 2,
	            				 sessionMaxScreen: 2,
	            				 sessionScreen: 2,
	            				 sessionCollaborative: true,
	            				 sessionDrawable: "true",
	            				 sessionBackground: "../images/picturecompletion/TTCT_Fig_Parts_Figure_1.svg",
	            				 sessionNickName: context.session.Name});
	        });
		}		
};