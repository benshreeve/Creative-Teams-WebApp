module.exports = function (conn) {
	var utils = require('./utils.js')();
	var logger = require('./logger.js')()
	return {
		getActiveUsersCount: function(callback, args) {
			conn.query('select * from users where users.Active = "1"', function(err, rows){
	            if(err) throw err;
	            if (callback)
	            	callback(rows.length, args);
	            else
	            	logger.log("Total Number of users: ", rows.length);
	        });
		},
		
		activateUser: function(teamID, userID) {
			post = {Active: 1};
			conn.query('UPDATE users SET ? WHERE users.TeamID = ' + teamID + ' AND users.UserID = ' + userID + ';', 
					post, function(err, result) {});
		},
		
		deactivateUser: function(teamID, userID) {
			post = {Active: 0};
			conn.query('UPDATE users SET ? WHERE users.TeamID = ' + teamID + ' AND users.UserID = ' + userID + ';', 
					post, function(err, result) {});
		},

		deactivateAllUsers: function() {
			post = {Active: 0};
			conn.query('UPDATE users SET ? ;', post, function(err, result) {});
		},
		
		enableUser: function(teamID, userID) {
			post = {Enabled: 1};
			conn.query('UPDATE users SET ? WHERE users.TeamID = ' + teamID + ' AND users.userID = ' + userID + ';', 
					post, function(err, result) {});
		},

		disableUser: function(teamID, userID) {
			post = {Enabled: 0};
			conn.query('UPDATE users SET ? WHERE users.TeamID = ' + teamID + ' AND users.userID = ' + userID + ';', 
					post, function(err, result) {});
		},
		
		saveTransaction: function(teamID, userID, testID, transaction) {
			var q = 'INSERT INTO `transactions`(`TeamID`, `TestID`, `UserID`, `ScreenNumber`, `Object`, `Operation`, `OperationData`, `Time`) VALUES ("'+
				teamID + '","' + testID + '","'+ userID + '","' + transaction.ScreenNumber + '","' + transaction.ObjectID + '","' + 
				transaction.Operation + '","' + JSON.stringify(transaction.OperationData).replace(/["]/g, '\\\"')+'", now(6)'+');'
            query = conn.query(q, post, function(err, result) {
                console.log("Saving a transaction:" + query.sql);
                if(err) throw err;
            });			
		},
		
		drawDot: function(dot) {
			id = dot.owner.match(/[0-9]+/g);
			teamID = id[0];
			userID = id[1];
			var q = 'INSERT INTO `transactions`(`TeamID`, `TestID`, `UserID`, `ScreenNumber`, `Object`, `Operation`, `OperationData`, `Time`) VALUES ("'+
					teamID + '","' + 0 + '","'+ userID + '","' + 1 + '","' + 1 + '","' + 1 + '",' + '"{x:' + dot.x + ',y:' + dot.y+ ' ,rad:' + dot.rad + '}"'+', now(6)'+');'
			
            query = conn.query(q, post, function(err, result) {
                if(err) throw err;
                console.log("Drawing a dot:" + query.sql);
            });
		},
		
		eraseDot: function(dot) {
			id = dot.owner.match(/[0-9]+/g);
			teamID = id[0];
			userID = id[1];
			var q = 'INSERT INTO `transactions`(`TeamID`, `TestID`, `UserID`, `ScreenNumber`, `Object`, `Operation`, `OperationData`, `Time`) VALUES ("'+
					teamID + '","' + 0 + '","'+ userID + '","' + 1 + '","' + 1 + '","' + 2 + '",' + '"{x:' + dot.x + ',y:' + dot.y+ ',rad:' + dot.rad +'}"'+', now(6)'+');'
			
			query = conn.query(q, post, function(err, result) {                
				if(err) throw err;
                console.log("Erasing a Dot: "+ query.sql);
            });			
		},
		
		getTransactions: function(teamID, testID, screen, callback, args) {
			conn.query('select * from transactions where transactions.TeamID = "'+ teamID + 
							 '" and transactions.TestID = "' + testID +
							 '" and transactions.ScreenNumber = "' + screen + '"', function(err, rows) {
				if (err) throw err;
				
				callback(rows, args);
			});
		},
		
		getUser: function(teamID, userID, callback, args) {
			conn.query('select * from users where users.TeamID="'+teamID+'" and users.UserID="'+userID+'"',
					function(err, rows) {
				if (err) throw err;
				callback(rows[0], args);
			});
		},
		
		setUserName: function(teamID, userID, name) {
			var post  = {Name: name};
			conn.query('UPDATE users SET ? WHERE users.teamID = "'+ teamID + 
					   '" and users.UserID="' + userID + '"', post, function(err, row) {if (err) throw err;});
		},
		
		getTestTimeLimit: function(testID, callback, args) {
			var name = utils.getTestName(testID);
			conn.query('select ' + name + 'TimeLimit from config', function(err, rows) {
				if (err) throw err;
				callback(eval("rows[0]."+name+"TimeLimit"), args);
			});			
		},
		
		getTestInstructionFile: function(testID, callback, args) {
			var name = utils.getTestName(testID);
			conn.query('select ' + name + 'InstructionFile from config', function(err, rows) {
				if (err) throw err;
				callback(eval("rows[0]."+name+"InstructionFile"), args);
			});			
		},

		getIntroductionFile: function(callback, args) {			
			conn.query('select IntroductionFile from config', function(err, rows) {
				if (err) throw err;
				callback(eval("rows[0].IntroductionFile"), args);
			});			
		},
		
		getResultsPath: function(callback, args) {
			conn.query('select ResultsPath from config', function(err, rows) {
				if (err) throw err;
				callback(rows[0].ResultsPath, args);
			});						
		}

	};
};