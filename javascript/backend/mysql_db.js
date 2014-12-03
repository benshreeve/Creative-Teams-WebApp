module.exports = function (conn) {
	return {
		getActiveUsersCount: function(callback) {
			conn.query('select * from users where users.Active = "1"', function(err, rows){
	            if(err) throw err;
	            if (callback)
	            	callback(rows.length);
	            else
	            	console.log("Total Number of users: ", rows.length);
	        });
		},
		
		activateUser: function(teamID, userID) {
			post = {Active: 1};
			conn.query('UPDATE users SET ? WHERE users.TeamID = ' + teamID + ' AND users.userID = ' + userID + ';', 
					post, function(err, result) {});
		},
		
		deactivateUser: function(teamID, userID) {
			post = {Active: 0};
			conn.query('UPDATE users SET ? WHERE users.TeamID = ' + teamID + ' AND users.userID = ' + userID + ';', 
					post, function(err, result) {});
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
		
		drawDot: function(dot) {
			id = dot.owner.match(/[0-9]+/g);
			teamID = id[0];
			userID = id[1];
			var q = 'INSERT INTO `transactions`(`TeamID`, `TestID`, `UserID`, `ScreenNumber`, `ObjectID`, `Operation`, `OperationData`, `Time`) VALUES ("'+
					teamID + '","' + 0 + '","'+ userID + '","' + 1 + '","' + 1 + '","' + 1 + '",' + '"{x:' + dot.x + ',y:' + dot.y+ '}"'+', now(6)'+');'
			
            query = conn.query(q, post, function(err, result) {
                if(err) throw err;
                console.log("Drawing a dot:" + query.sql);
            });
		},
		
		eraseDot: function(dot) {
			id = dot.owner.match(/[0-9]+/g);
			teamID = id[0];
			userID = id[1];
			var q = 'INSERT INTO `transactions`(`TeamID`, `TestID`, `UserID`, `ScreenNumber`, `ObjectID`, `Operation`, `OperationData`, `Time`) VALUES ("'+
					teamID + '","' + 0 + '","'+ userID + '","' + 1 + '","' + 1 + '","' + 2 + '",' + '"{x:' + dot.x + ',y:' + dot.y+ '}"'+', now(6)'+');'
			
			query = conn.query(q, post, function(err, result) {                
				if(err) throw err;
                console.log("Erasing a Dot: "+ query.sql);
            });			
		}
				
	};
};