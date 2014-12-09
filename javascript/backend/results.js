/**
 * New node file
 */
module.exports = function (context) {
	var util = require("./utils.js")();
	var fs = require('fs');
	
	return {			
		saveImage: function(image) {
        	var b64string = image.replace(/^data:image\/png;base64,/,"");
        	var buf = new Buffer(b64string, 'base64');
        	context.rdb.getTeam(context.session.TeamID, saveResult, {data: buf, ext:".png"});
		},
		
		saveTitle: function(title) {
        	context.rdb.getTeam(context.session.TeamID, saveResult, {data:title, ext:".txt"});			
		},
		
	};
	
	function saveResult(teamInfo, args) {
		context.db.getResultsPath(writeFile, {data: args.data, ext: args.ext, testID: teamInfo.CurrentTest, 
			screen: teamInfo.CurrentScreen});
	}
	
	function writeFile(path, args) {		
		var path = path+"/"+context.session.TeamID+"/"+args.testID;
		if (!fs.existsSync(path))
			fs.mkdirSync(path);
		fs.writeFile(path+"/"+args.screen+args.ext, args.data, 
				function(err) {if (err) throw err;});
	}
};