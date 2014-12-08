/**
 * New node file
 */

module.exports = function() {
	var tests = [{name:"PracArea", screenLimit: 1, handler: './javascript/backend/pic_comp.js'},
	             {name:"PicCon",   screenLimit: 1, handler: './javascript/backend/pic_con.js'},
	             {name:"PicComp",  screenLimit: 10, handler: './javascript/backend/pic_comp.js'},
	             {name:"ParLines", screenLimit: 18, handler: './javascript/backend/par_lines.js'},
	             {name:"IdeaGen",  screenLimit: 1, handler: './javascript/backend/idea_gen.js'},
	             {name:"DesChal",  screenLimit: 99, handler: './javascript/backend/des_chal.js'},
	             {name:"AltUses",  screenLimit: 1, handler: './javascript/backend/alt_uses.js'}];
	var colours = ["", "purple", "red", "blue", "orange", "green"];
	return {
		isDup: function(list, item) {
			items = list.split(',');
			if (items.length > 0) {
				for (i=0; i < items.length; i++) {
					if (items[i] == item)
						return true;
				}
			}
			return false;
		},
	
		isEqual: function(list1, list2) {
			if (list1.length != list2.length)
				return false;
			items1 = list1.split(',').sort();
			items2 = list2.split(',').sort();
			for (i=0; i < items1.length; i++) {
				if (items1[i] != items2[i])
					return false;
			}
			return true;
		},
		
		addItemUnique: function(list, item) {
			if (!this.isDup(list, item)) {
				if (list.length > 0)
					list += ',';
				list += item;
			}
			return list;
		},
		
		delItem: function(list, item) {
			items = list.split(',');
			if (items.length > 0) {
				index = items.indexOf(item);
				if (index > -1) {
					items.splice(index, 1);
					var newList = "";
					for (i = 0; i < items.length; i++) {
						newList += items[i];
						if (i < items.length-1)
							newList += ',';				
					}
					return newList;
				}
			}		
			return list;
		},
		
		getTeamID: function(accessCode) {
			return accessCode.match(/[0-9]+/g)[0];
		},
		
		getUserID: function(accessCode) {
			return accessCode.match(/[0-9]+/g)[1];
		},
		
		checkAccessCode: function(accessCode) {
			return /^s[0-9]+p[0-9]+$/.test(accessCode);
		},
		
		getTestName: function(testID) {
			return tests[testID].name;
		},
		
		getTestScreenLimit: function(testID) {
			return tests[testID].screenLimit;
		},
		
		getTestHandler: function(testID) {
			return tests[testID].handler;
		},
		
		getUserColor: function(userID) {
			return colours[userID];
		}
		
	};
};