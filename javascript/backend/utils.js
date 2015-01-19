/**
 * New node file
 */

module.exports = function() {
	runScript("./javascript/backend/constants.js");

	var tests = [{id: PRAC_AREA, longName: "PracticeArea", name:"PracArea", screenLimit: 1, handler: './javascript/backend/prac_area.js', instructionURL: '/tests/introduction.html', testURL:'/tests/practice_area.html'},
	             {id: PIC_CON, longName: "PictureConstruction", name:"PicCon",   screenLimit: 1, handler: './javascript/backend/pic_con.js', instructionURL: '/tests/pic_con_inst.html', testURL:'/tests/pic_con.html'},
	             {id: PIC_COMP, longName: "PictureCompletion", name:"PicComp",  screenLimit: 10, handler: './javascript/backend/pic_comp.js', instructionURL: '/tests/pic_comp_inst.html', testURL:'/tests/pic_comp.html'},
	             {id: PAR_LINES, longName: "ParallelLines", name:"ParLines", screenLimit: 18, handler: './javascript/backend/par_lines.js', instructionURL: '/tests/par_lines_inst.html', testURL:'/tests/par_lines.html'},
	             {id: IDEA_GEN, longName: "IdeaGeneration", name:"IdeaGen",  screenLimit: 1, handler: './javascript/backend/idea_gen.js', instructionURL: '/tests/idea_gen_inst.html', testURL:'/tests/idea_gen.html'},
	             {id: DES_CHAL, longName: "DesignChallenge", name:"DesChal",  screenLimit: 99, handler: './javascript/backend/des_chal.js', instructionURL: '/tests/des_chal_inst.html', testURL:'/tests/des_chal.html'},
	             {id: ALT_USES, longName: "AlternativeUses", name:"AltUses",  screenLimit: 1, handler: './javascript/backend/alt_uses.js', instructionURL: '/tests/alt_uses_inst.html', testURL:'/tests/alt_uses.html'},
	             {id: END_TEST, longName: "EndTest", name:"End",  screenLimit: 1, handler: './javascript/backend/end.js', instructionURL: '/tests/end.html', testURL:'/tests/end.html'}];
	
	var colours = ["", "purple", "red", "blue", "orange", "green"];
	var testsOrder = [PRAC_AREA, END_TEST]; //, PIC_CON, PIC_COMP, PAR_LINES, IDEA_GEN, DES_CHAL, ALT_USES];
	var messageMap=[[]];
	fillMessageMap();
	
	
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
		
		getLength: function(list) {
			return list.split(',').length;
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
			return getTestInfo(testID).name;
		},

		getTestLongName: function(testID) {
			return getTestInfo(testID).longName;
		},
		
		getTestScreenLimit: function(testID) {
			return getTestInfo(testID).screenLimit;
		},
		
		getTestHandler: function(testID) {
			return getTestInfo(testID).handler;
		},

		getInstructionURL: function(testID) {
			return getTestInfo(testID).instructionURL;
		},
		
		getTestURL: function(testID) {
			return getTestInfo(testID).testURL;
		},
		
		getNextTestID: function(testID) {
			for (i = 0; i < testsOrder.length; i++) {				
				if (testsOrder[i] == testID) {
					return testsOrder[i+1];
				}
			}
			return -1;
		},

		getUserColor: function(userID) {
			return colours[userID];
		},
		
		includeConstants: function(path) {
			runScript(path);
		},
		
		getMessage: function(object, operation) {
			return messageMap[object][operation];
		},
		
		randomFileName: function(prefix, extension) {
			return  prefix + "-" + new Date().getTime() + "." + extension;
		}
		
	};
	
	function getTestInfo(testID) {		
		for (i = 0; i < tests.length; i++) {
			if (tests[i].id == testID) {
				return tests[i];
			}
		}
		return null;
	}
	
	function runScript(path) {
		var fs = require('fs');
		var vm = require('vm');
		var includeInThisContext = function(path) {
			var code = fs.readFileSync(path);
			vm.runInThisContext(code, path);
		}.bind(this);
		includeInThisContext(path);
	}
	
	function createMap() {
		   messageMap = new Array(NUM_OBJECTS+1);
		   for (var i = 0; i < NUM_OBJECTS+1; i++) {
		       messageMap[i] = new Array(NUM_OPERATIONS+1);
		   }
	}
	
	function fillMessageMap() {
		createMap();
		messageMap[DOT][DRAW] = DRAW_MSG;
		messageMap[DOT][ERASE] = ERASE_MSG;
		messageMap[TITLE][ADD] = UPDATE_TITLE_MSG;
		messageMap[OBJECT][UNDO] = UNDO_MSG;
		messageMap[OBJECT][REDO] = REDO_MSG;
		messageMap[IDEA][ADD] = ADD_IDEA_MSG;
		messageMap[IDEA][DEL] = DEL_IDEA_MSG;
		messageMap[IDEA][UPDATE] = UPDATE_IDEA_MSG;
		messageMap[USE][ADD] = ADD_USE_MSG;
		messageMap[USE][DEL] = DEL_USE_MSG;
		messageMap[USE][UPDATE] = UPDATE_USE_MSG;		
	}
	
	
};