/**
 * New node file
 */

module.exports = 
{
		installHandlers: function(context) {
			var commons = require('./commons.js')(context);
	        var constants = require('./constants.js');
	        var utils = require('./utils.js')();
	        var results = require('./results')(context);
	        var constants = require('./constants');

			
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
	        	if (op == constants.LOAD_PRACTICE_AREA_PAGE) {
	        		context.rdb.addReadyParticipant(context.session.TeamID, context.session.AccessCode);
	        		context.rdb.checkReadyParticipants(context.session.TeamID, LoadPracAreaRsp);
	        	}
	        });
	        
	        function LoadPracAreaRsp(allReady, len) {
	        	if (allReady && len >= 2) {
	        		context.channel.sendToTeam(context.session.TeamID, constants.PERM_RSP, {decision:constants.GRANTED, operation:constants.LOAD_PRACTICE_AREA_PAGE});
	        		context.rdb.clearReadyParticipants(context.session.TeamID);
	        	}
	        }
	        
	        	       	       
	        context.socket.on('sessionrequest', function() {
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
				//sendState(session.sessionScreen);
	            context.db.getTransactions(1, 0, 1, sendTransactions);
	            
	        });
			
			// When a client requests its session ID only:
	        context.socket.on('sessionTitle', function() {
	            context.channel.sendToUser(context.session.AccessCode, 'sessionRequest', context.session);
				//sendState(session.sessionScreen);
	        });
			
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
	        function sendTransactions(rows) {
                for(var i = 0; i<rows.length; i++) {
                	var oData = eval('(' + rows[i].OperationData + ')');
                	var drag = rows[i].Operation == 1 ? true : false;
                	var color = "rgba(0,0,0,1)";
                	if (drag) {
                		color = utils.getUserColor(rows[i].UserID);
                	}
                	//console.log("oData: ", oData, "operation:", rows[i].Operation, "drag:", drag, "color: ", color);                	
                    context.channel.sendToUser(context.session.AccessCode, 'mousedot', {x:oData.x, y:oData.y, drag:drag, rad:oData.rad, colour:color, 
                    		owner:'s'+rows[i].TeamID+'p'+rows[i].UserID, group:rows[i].TeamdID, screen:2});
                }	        	
	        }

	        // When we receive drawing information:
	        context.socket.on('mousedot', function(dot){
	            context.channel.sendToTeam(context.session.TeamID, 'mousedot', dot);
	            // Post to the database here:				
	            dot.drag ? context.db.drawDot(dot) : context.db.eraseDot(dot);				
	        });
	        
	        context.socket.on('GetResultsRsp', function(res) {
	        	console.log("results received from ", context.session.AccessCode, "...");
	        	results.saveImage(res.image);
	        	results.saveTitle(res.title);	        	        
	        });

	        // On client disconnection, update the database:
	        context.socket.on('disconnect', function(){
				context.db.deactivateUser(context.session.TeamID, context.session.UserID);
				context.db.getActiveUsersCount();
				context.rdb.delParticipant(context.session.TeamID, context.session.AccessCode);
				context.channel.leaveTeam(context.session.AccessCode, context.session.TeamID);
				context.channel.disconnect(context.session.AccessCode);
	        });	
	        
	        // When a client requests its session:
	        context.socket.on('IsBackendReadyReq', function() {
	        	console.log("backend is ready now ...");
	        	context.channel.sendToUser(context.session.AccessCode, "IsBackendReadyRsp", "READY");
	        });
	        
	        function testComplete() {
	        	commons.sendTestComplete();
	        	commons.sendGetResultsReq();
	        }
	       	       
	        commons.sendBackendReady();	        
	        commons.setupTestTime(constants.PIC_COMP, testComplete);
	               
	        function x(t) {
	        	console.log('t = ', t);
	        }
	        
	        console.log("Hanlders were installed for practice area.");
		}		
};