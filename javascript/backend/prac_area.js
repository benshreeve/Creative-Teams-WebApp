/**
 * New node file
 */

module.exports = 
{
		installHandlers: function(context) {
			var commons = require('./commons.js')(context);
			utils.includeConstants('./javascript/backend/constants.js');
			
	        context.socket.on(GET_TEST_STATE_REQ, function() {
	        	context.rdb.getTeam(context.session.TeamID, sendTestState);
	        });
	        
	        function sendTestState(teamInfo) {
	        	context.channel.sendToUser(context.session.AccessCode, GET_TEST_STATE_RSP, teamInfo);
	        }
	        
	        context.socket.on(GET_SESSION_STATE_REQ, function() {
	        	context.channel.sendToUser(context.session.AccessCode, GET_SESSION_STATE_RSP, context.session);
	        });
	        
        
	        context.socket.on(PERM_REQ, function(op) {
	        	switch (op) {
	        	case LOAD_PRACTICE_AREA_PAGE:
	        		context.rdb.addReadyParticipant(context.session.TeamID, context.session.AccessCode);
	        		context.rdb.getCurrentScreen(context.session.TeamID, loadPracAreaRsp);
	        		break;
	        	case EDIT_TITLE:
	        		context.rdb.setTextEditingUser(context.session.TeamID, context.session.Name, editTitleRsp);
	        	}
	        });
	        
	        function loadPracAreaRsp(currentScreen) {
	        	if (currentScreen > INSTRUCTION_SCREEN) {
	        		context.channel.sendToUser(context.session.AccessCode, PERM_RSP, 
	        				{decision:GRANTED, operation:LOAD_PRACTICE_AREA_PAGE});
	    	        commons.setupTestTime(PIC_COMP, testComplete);
	        	} else {
	        		context.rdb.checkReadyParticipants(context.session.TeamID, checkOtherParticipants);
	        	}
	        }
	        
	        function checkOtherParticipants(allReady, len) {
	        	if (allReady && len >= 2) {
	        		context.channel.sendToTeam(context.session.TeamID, PERM_RSP, 
	        				{decision:GRANTED, operation:LOAD_PRACTICE_AREA_PAGE});
	        		context.rdb.clearReadyParticipants(context.session.TeamID);
	        		context.rdb.setCurrentScreen(context.session.TeamID, 1);
	    	        commons.setupTestTime(PIC_COMP, testComplete);
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
	        
	        context.socket.on(UPDATE_TITLE_MSG, function(title) {
	        	context.channel.sendToTeam(context.session.TeamID, UPDATE_TITLE_MSG, title);
	        	context.rdb.clearTextEditingUser(context.session.TeamID);
	        });
	        
	        
	        context.socket.on(DRAW_MSG, function(dot) {
	        	
	        });
	        
	        context.socket.on(ERASE_MSG, function(dot) {
	        	
	        });
	        
	        context.socket.on('mousedot', function(dot){
	            context.channel.sendToTeam(context.session.TeamID, 'mousedot', dot);
	            // Post to the database here:				
//	            dot.drag ? context.db.drawDot(dot) : context.db.eraseDot(dot);				
	        });
	        

	        // On client disconnection, update the database:
	        context.socket.on(DISCONNECT_MSG, function(){
				context.db.deactivateUser(context.session.TeamID, context.session.UserID);
				context.db.getActiveUsersCount();
				context.rdb.delParticipant(context.session.TeamID, context.session.AccessCode);
				context.rdb.delReadyParticipant(context.session.TeamID, context.session.AccessCode);
				context.channel.leaveTeam(context.session.AccessCode, context.session.TeamID);
				context.channel.disconnect(context.session.AccessCode);
	        });	
	        
	        // When a client requests its session:
	        context.socket.on(IS_BACKEND_READY_REQ, function() {
	        	context.channel.sendToUser(context.session.AccessCode, IS_BACKEND_READY_RSP, READY);
	        });
	        	       	       
	        commons.sendBackendReady();	        
	        
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