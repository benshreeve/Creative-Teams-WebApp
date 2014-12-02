module.exports = function (conn) {
	return {
		getActiveUsersCount: function(callback) {
			conn.query('select * from users where users.active = "1"', function(err, rows){
	            if(err) throw err;
	            if (callback)
	            	callback(rows.length);
	            else
	            	console.log("Total Number of users: ", rows.length);
	        });
		},
		
		activateUser: function(access_code) {
			post = {active: 1};
			conn.query('UPDATE users SET ? WHERE users.accessid = "' + access_code +'";', 
					post, function(err, result) {});
		},
		
		deactivateUser: function(access_code) {
			post = {active: 0};
			conn.query('UPDATE users SET ? WHERE users.accessid = "' + access_code +'";', 
					post, function(err, result) {});
		},
		
		enableUser: function(access_code) {
			post = {enabled: 1};
			conn.query('UPDATE users SET ? WHERE users.accessid = "' + access_code +'";', 
					post, function(err, result) {});
		},

		disableUser: function(access_code) {
			post = {enabled: 0};
			conn.query('UPDATE users SET ? WHERE users.accessid = "' + access_code +'";', 
					post, function(err, result) {});
		},
		
		drawDot: function(dot) {
            query = conn.query('INSERT INTO `transactions`(`xpoint`, `ypoint`, `drag`, `radius`, `owner`, `time`, `screen`, `colour`, `group`) VALUES ("'+ dot.x +'","'+ dot.y +'","'+ dot.drag +'","'+ dot.rad +'","'+ dot.owner +'", now(6),"'+ dot.screen +'","'+ dot.colour +'","'+ dot.group +'");', post, function(err, result) {
                if(err) throw err;
                console.log("Drawing a dot:" + query.sql);
            });
		},
		
		eraseDot: function(dot) {
            query = conn.query('INSERT INTO `transactions`(`xpoint`, `ypoint`, `drag`, `radius`, `owner`, `time`, `screen`, `colour`, `group`) VALUES ("'+ dot.x +'","'+ dot.y +'","'+ dot.drag +'","'+ dot.rad +'","'+ dot.owner +'", now(6),"'+ dot.screen +'","'+ dot.colour +'","'+ dot.group +'");', post, function(err, result) {
                if(err) throw err;
                console.log("Erasing a Dot: "+ query.sql);
            });			
		}
				
	};
};