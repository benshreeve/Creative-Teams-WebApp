/**
 * New node file
 */

module.exports = function(context) {
	
	return {
		log: function() {
			var cmd = "console.log(";
			for (var i = 0; i < arguments.length; i++) {
				cmd += '"'+arguments[i]+'"';
				if (i < arguments.length-1)
					cmd += ',';
			}
			cmd += ")";
			eval(cmd);
		},
	
		debug: function() {
			if (debug) {
				var cmd = "console.log('[";
				if (context != undefined && context.session != undefined) 
					cmd += context.session.AccessCode + "(" + context.session.Name + ")" + (context.session.Late ? ":Late" : "");
				cmd += "]',";
				for (var i = 0; i < arguments.length; i++) {
					cmd += '"'+arguments[i]+'"';
					if (i < arguments.length-1)
						cmd += ',';
				}
				cmd += ")";
				eval(cmd);
			}
		}				
	};
};