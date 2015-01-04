/**
 * New node file
 */

module.exports = 
{
		installHandlers: function(context) {
			var commons = require('./commons.js')(context);
			var utils = require('./utils')();
			var logger = require('./logger')(context);
			utils.includeConstants('./javascript/backend/constants.js');
			
	        context.socket.on(GET_TEST_STATE_REQ, function() {
	        	commons.sendTestStateRsp();
	        });
	        	        
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
	    	        commons.setupTestTime(PRAC_AREA, testComplete);
	        }
	        
	        function startTest() {
	        	if (context.session.Late) {
	        		context.rdb.getCurrentTest(context.session.TeamID, joinLateParticipant)
	        	} else {
	        		context.rdb.setCurrentTest(context.session.TeamID, PIC_CON);
	        		context.rdb.setCurrentScreen(context.session.TeamID, INSTRUCTION_SCREEN);
	        		context.channel.sendToTeam(context.session.TeamID, GOTO_MSG, utils.getInstructionURL(PIC_CON));
	        	}
	        }
	        
	        function joinLateParticipant(currentTest) {
	        	context.session.Late = false;
	        	context.session.save();
	        	context.rdb.getCurrentScreen(context.session.TeamID, sendTestURL, {currentTest: currentTest});
	        }
	        
	        function sendTestURL(currentScreen, args) {
	        	context.channel.sendToUser(context.session.AccessCode, GOTO_MSG, 
	        			currentScreen == INSTRUCTION_SCREEN ? utils.getInstructionURL(args.currentTest) : utils.getTestURL(args.currentTest));
	        }
	        
	        context.socket.on(UPDATE_TITLE_MSG, function(title) {
	        	commons.handleUpdateTitleMsg(title);
	        });
	        
	        
	        context.socket.on(DRAW_MSG, function(dot) {
	        	commons.broadcastTransaction(DRAW_MSG, PRAC_AREA, dot);
	        });
	        
	        context.socket.on(ERASE_MSG, function(dot) {
	        	commons.broadcastTransaction(ERASE_MSG, PRAC_AREA, dot);
	        });

	        context.socket.on(UNDO_MSG, function(object) {
	        	commons.broadcastTransaction(UNDO_MSG, PRAC_AREA, object);
	        });

	        context.socket.on(REDO_MSG, function(object) {
	        	commons.broadcastTransaction(REDO_MSG, PRAC_AREA, object);
	        });
	        
	        context.socket.on(DISCONNECT_MSG, function(){
	        	commons.disconnectUser();
	        });	
	        
	        context.socket.on(IS_BACKEND_READY_REQ, function() {
	        	commons.sendIsBackendReadyRsp(READY);
	        });
	        
	        context.socket.on(GET_TEST_INSTRUCTION_REQ, function() {
	        	commons.sendInstructionFile();
	        });
	        	       	       
	        commons.sendBackendReadyMsg();	        
	        
	        function testComplete() {
	        	commons.sendTestComplete();
	        }
	                       
	        logger.debug("Hanlders were installed for practice area.");
	        

	        context.socket.on('mousedot', function(dot){
	        	commons.broadcastTransaction('mousedot', PRAC_AREA, dot);
	            //context.channel.sendToTeam(context.session.TeamID, 'mousedot', dot);
	            // Post to the database here:				
//	            dot.drag ? context.db.drawDot(dot) : context.db.eraseDot(dot);				
	        });
	                
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