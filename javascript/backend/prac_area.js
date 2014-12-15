/**
 * New node file
 */

module.exports = 
{
		installHandlers: function(context) {
			var commons = require('./commons.js')(context);
			var utils = require('./utils')();
			utils.includeConstants('./javascript/backend/constants.js');
			
	        context.socket.on(GET_TEST_STATE_REQ, function() {
	        	commons.sendTestStateRsp();
	        });
	        
	        function sendTestState(teamInfo) {
	        	context.channel.sendToUser(context.session.AccessCode, GET_TEST_STATE_RSP, teamInfo);
	        }
	        
	        context.socket.on(GET_SESSION_STATE_REQ, function() {
	        	commons.sendSessionStateRsp();
	        });
	        
        
	        context.socket.on(PERM_REQ, function(op) {
	        	switch (op) {
	        	case LOAD_PRACTICE_AREA_PAGE:
	        		commons.checkAllReady(op, PRAC_AREA, !context.session.Late ? setupTestTimer: undefined);
	        		break;
	        	case START_TEST:
	        		commons.checkAllReady(op, PRAC_AREA, startTest);
	        		break;
	        	case EDIT_TITLE:
	        		commons.checkEditTitle();
	        	}
	        });
	        
	        function setupTestTimer() {
	    	        commons.setupTestTime(PIC_COMP, testComplete);
	        }
	        
	        function startTest() {
	        	if (context.session.Late) {
	        		rdb.getCurrentTest(context.session.TeamID, joinLateParticipant)
	        	} else {
	        		context.rdb.setCurrentTest(context.session.TeamID, PIC_CON);
	        		context.rdb.setCurrentScreen(context.session.TeamID, INSTRUCTION_SCREEN);
	        		context.channel.sendToTeam(context.session.TeamID, GOTO_MSG, utils.getInstructionURL(PIC_CON));
	        	}
	        }
	        
	        function joinLateParticipant(currentTest) {
	        	context.session.Late = false;
	        	context.session.save();
	        	context.rdb.getCurrentScreen(context.sesssion.TeamID, sendTestURL, {currentTest: currentTest});
	        	}
	        
	        function sendTestURL(currentScreen, args) {
	        	context.channel.sendToUser(context.session.AccessCode, GOTO_MSG, 
	        			currentScreen == INSTRUCTION_SCREEN ? utils.getInstructionURL(args.currentTest) : utils.getTestURL(args.currentTest));
	        	}
	        
	        context.socket.on(UPDATE_TITLE_MSG, function(title) {
	        	context.channel.sendToTeam(context.session.TeamID, UPDATE_TITLE_MSG, title);
	        	context.rdb.clearTextEditingUser(context.session.TeamID);
	        });
	        
	        
	        context.socket.on(DRAW_MSG, function(dot) {
	        	dot.userID = context.session.UserID;
	        	context.channel.sendToTeam(context.session.TeamID, DRAW_MSG, dot);
	        });
	        
	        context.socket.on(ERASE_MSG, function(dot) {
	        	dot.userID = context.session.UserID;
	        	context.channel.sendToTeam(context.session.TeamID, ERASE_MSG, dot);	        	
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
	        	       	       
	        commons.sendBackendReadyMsg();	        
	        
	        function testComplete() {
	        	commons.sendTestComplete();
	        }
	                       
	        logger.debug("Hanlders were installed for practice area.");
	        
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