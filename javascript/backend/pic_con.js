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
			
		//	utils.includeConstants('./javascript/backend/constants.js');
			
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
	        	commons.sendTransactions(PIC_CON);
	        });	        
	                
	        context.socket.on(PERM_REQ, function(op) {
	        	switch (op) {
	        	case LOAD_PICCON_TEST_PAGE:
	        		commons.checkAllReady(op, PIC_CON, picConSetupTestTimer);
	        		break;
	        	case CREATE_BACKGROUND:
	        		context.rdb.setPicConBGCreator(context.session.TeamID, context.session.AccessCode, picConSendCreateBGRsp);
	        		break;
	        	case EDIT_TITLE:
	        		commons.checkEditTitle();
	        		break;
	        	}
	        });
	        
	        function picConSetupTestTimer() {
	    	        commons.setupTestTime(PIC_CON, picConTestComplete);
	        }
	        
	        function picConSendCreateBGRsp(creator) {
	        	if (creator == context.session.AccessCode) {
	        		context.channel.sendToUser(context.session.AccessCode, PERM_RSP, {decision:GRANTED});	        		
	        	} else {
	        		context.channel.sendToUser(context.session.AccessCode, PERM_RSP, {decision:DECLINED, info:creator});
	        	}
	        }
	                	        
	        context.socket.on(UPDATE_TITLE_MSG, function(title) {
	        	commons.handleUpdateTitleMsg(title);
	        });
	        
	        context.socket.on(PICCON_BG_CREATED_MSG, function(location) {
	        	context.rdb.setBGCreated(context.session.TeamID, true);
	        	context.channel.sendToTeam(context.session.TeamID, PICCON_BG_CREATED_MSG, location);	        	
	        });
	        
	        context.socket.on(MOVE_SHAPE_MSG, function(data) {
	        	logger.debug("MOVE_SHAPE_MSG: ", data);
	        	commons.broadcastTransaction(MOVE_SHAPE_MSG, PIC_CON, data);
	        });
	        
	        context.socket.on(ROTATE_SHAPE_MSG, function(data) {
	        	commons.saveAndBroadcastTransaction(ROTATE_SHAPE_MSG, PIC_CON, data);	        	
	        });
	        
	        context.socket.on(DRAW_MSG, function(dot) {
	        	commons.saveAndBroadcastTransaction(DRAW_MSG, PIC_CON, dot);
	        });
	        
	        context.socket.on(ERASE_MSG, function(dot) {
	        	commons.saveAndBroadcastTransaction(ERASE_MSG, PIC_CON, dot);
	        });
	        
	        context.socket.on(UNDO_MSG, function(object) {
	        	commons.saveAndBroadcastTransaction(UNDO_MSG, PIC_CON, object);
	        });
	        
	        context.socket.on(REDO_MSG, function(object) {
	        	commons.saveAndBroadcastTransaction(REDO_MSG, PIC_CON, object);
	        });
	        	             
	        context.socket.on(DISCONNECT_MSG, function() {
	        	commons.disconnectUser();
	        });	
	        
	        context.socket.on(IS_BACKEND_READY_REQ, function() {
	        	commons.sendIsBackendReadyRsp(PIC_CON);
	        });

	        context.socket.on(GET_RESULTS_RSP, function(res) {
	        	logger.debug("Results received ...");
	        	results.saveImage(res.image);
	        	results.saveTitle(res.title);
	        	
	        	logger.debug("Redirect team " + context.session.TeamID + " to ", utils.getTestName(PIC_COMP));
	        	//channel.sendToTeam(context.session.TeamID, GOTO_MSG, utils.getInstructionURL(PIC_COMP));
	        });
	        
	        context.socket.on(GET_TEST_INSTRUCTION_REQ, function() {
	        	commons.sendInstructionFile(PIC_CON);
	        });	        
	        	        	       	              
	        function picConTestComplete() {
	        	commons.sendTestComplete();
	        	commons.sendGetResultsReq();
	        }
	          
	        //setupTestTimer(PIC_CON, testComplete);
	        logger.debug("Hanlders were installed for picture construction test.");	        
		}		
};



			/*
			function readState(screenNumber, limit1, limit2){
				var stuff = connection.query('select * from transactions where transactions.screen = "'+ screenNumber +'" and transactions.group = "'+session.sessionGroup+'" limit '+limit1+', '+limit2, function(err, rows){
	                if(err) throw err;
	                for(var i = 0; i<rows.length; i++) {
	                    socket.emit('mousedot', {x:rows[i].xpoint, y:rows[i].ypoint, drag:rows[i].drag, rad:rows[i].radius, colour:rows[i].colour, owner:rows[i].owner, group:session.sessionGroup, screen:rows[i].screen});
	                }
	            });	
			}

	        function sendState(screenNumber) {
	            // connect to the database.
	            // emit each row element as a draw to specific socket - use socket.id.
				var rowNumber = 0;
				var stuff = connection.query('select * from transactions where transactions.screen = "'+ screenNumber +'" and transactions.group = "'+session.sessionGroup+'"', function(err, rows)
				//var stuff = connection.query('select * from transactions where transactions.screen = "'+ screenNumber +'" and transactions.group = "'+session.sessionGroup+'" limit 1000', function(err, rows)
				{
	                rowNumber = rows.length;
					console.log("row number = " + rowNumber);
					for(var i = 0; i<rowNumber; i=i+10) {
						setTimeout(readState(screenNumber, i, 10), 20*i);
					}
	            });	            
	        }
	        */	       	       