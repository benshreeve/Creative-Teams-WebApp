/**
 * Author: Habib Naderi
 * Department of Computer Science, University of Auckland
 * 
 * This module contains a set of utility functions which are used in other modules. 
 */

module.exports = function(context) {
	runScript("./javascript/backend/constants.js"); // load constants
	var logger = require('./logger.js')();
	// tests information
	var tests = [{id: PRAC_AREA, longName: "PracticeArea",        name:"PracArea", screenLimit: 1,                    handler: './javascript/backend/prac_area.js', instructionURL: '/assets/tests/introduction.html'+VERSION,   testURL:'/assets/tests/practice_area.html'},
	             {id: PIC_CON,   longName: "PictureConstruction", name:"PicCon",   screenLimit: 1,                    handler: './javascript/backend/pic_con.js',   instructionURL: '/assets/tests/pic_con_inst.html'+VERSION,   testURL:'/assets/tests/pic_con.html'},
	             {id: PIC_COMP,  longName: "PictureCompletion",   name:"PicComp",  screenLimit: PIC_COMP_MAX_SCREEN,  handler: './javascript/backend/pic_comp.js',  instructionURL: '/assets/tests/pic_comp_inst.html'+VERSION,  testURL:'/assets/tests/pic_comp.html'},
	             {id: PAR_LINES, longName: "ParallelLines",       name:"ParLines", screenLimit: PAR_LINES_MAX_SCREEN, handler: './javascript/backend/par_lines.js', instructionURL: '/assets/tests/par_lines_inst.html'+VERSION, testURL:'/assets/tests/par_lines.html'},
	             {id: IDEA_GEN,  longName: "IdeaGeneration",      name:"IdeaGen",  screenLimit: 1,                    handler: './javascript/backend/idea_gen.js',  instructionURL: '/assets/tests/idea_gen_inst.html'+VERSION,  testURL:'/assets/tests/idea_gen.html'},
	             {id: DES_CHAL,  longName: "DesignChallenge",     name:"DesChal",  screenLimit: DES_CHAL_MAX_SCREEN,  handler: './javascript/backend/des_chal.js',  instructionURL: '/assets/tests/des_chal_inst.html'+VERSION,  testURL:'/assets/tests/des_chal.html'},
	             {id: ALT_USES,  longName: "AlternativeUses",     name:"AltUses",  screenLimit: 1,                    handler: './javascript/backend/alt_uses.js',  instructionURL: '/assets/tests/alt_uses_inst.html'+VERSION,  testURL:'/assets/tests/alt_uses.html'},
//	             {id: END_TEST,  longName: "EndTest",             name:"End",      screenLimit: 1,                    handler: './javascript/backend/end.js',       instructionURL: '/assets/tests/end.html'+VERSION,            testURL:'/assets/tests/end.html'},
	             {id: END_TEST,  longName: "EndTest",             name:"End",      screenLimit: 1,                    handler: './javascript/backend/end.js',       instructionURL: 'https://lancasteruni.qualtrics.com/SE/?SID=SV_726kfpD37MGLzq5', testURL:'https://lancasteruni.qualtrics.com/SE/?SID=SV_726kfpD37MGLzq5'}];
	
	var colours = ["", "purple", "red", "blue", "orange", "green"]; // user colors.
	var testsOrder = [PRAC_AREA, PIC_CON, PIC_COMP, PAR_LINES, IDEA_GEN, DES_CHAL, ALT_USES, END_TEST]; // default tests order.
	var messageMap=[[]]; //2-D array which maps an <object, operation> to a communication message.
	fillMessageMap();
	String.prototype.trim = String.prototype.trim || function () {
	    return this.replace(/^\s+|\s+$/g, "");
	};
	
	loadTestsOrder(); // load tests order from DB, if possible.
	
	return {
		// does item already exist in list? list is a string and items are separated by comma in the list.
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
	
		// do list1 and list2 contain the same items? list is a string and items are separated by comma in the list.
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
		
		// adds item to list if it is not already there. list is a string and items are separated by comma in the list. 
		addItemUnique: function(list, item) {
			if (!this.isDup(list, item)) {
				if (list.length > 0)
					list += ',';
				list += item;
			}
			return list;
		},
		
		// removes item from list. list is a string and items are separated by comma in the list.
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
		
		// returns the number of items in the list. list is a string and items are separated by comma in the list.
		getLength: function(list) {
			return list.split(',').length;
		},
		
		// extracts team ID from access code. 
		getTeamID: function(accessCode) {
			return accessCode.match(/[0-9]+/g)[0];
		},
		
		// extracts user ID from access code.		
		getUserID: function(accessCode) {
			return accessCode.match(/[0-9]+/g)[1];
		},
		
		// checks if access code has the right format (i.e. s<team-ID>p<user-ID>)
		checkAccessCode: function(accessCode) {
			return /^[sS][0-9]+[pP][0-9]+$/.test(accessCode);
		},
		
		// maps test ID to test name.		
		getTestName: function(testID) {
			return getTestInfo(testID).name;
		},

		// maps test ID to long test name.		
		getTestLongName: function(testID) {
			return getTestInfo(testID).longName;
		},
		
		// returns maximum number of screens for a test.
		getTestScreenLimit: function(testID) {
			return getTestInfo(testID).screenLimit;
		},
		
		// returns the name of javascript file which contains handlers for a test.
		getTestHandler: function(testID) {
			return getTestInfo(testID).handler;
		},

		// returns URL for instruction page for a test. 
		getInstructionURL: function(testID) {
			return getTestInfo(testID).instructionURL;
		},
		
		// returns URL for test page for a test.		
		getTestURL: function(testID) {
			return getTestInfo(testID).testURL;
		},
		
		// return ID of the test which should be taken after this test (specified by testID).
		getNextTestID: function(testID) {
			for (var i = 0; i < testsOrder.length; i++) {				
				if (testsOrder[i] == testID) {
					return testsOrder[i+1];
				}
			}
			return -1;
		},
		
		// returns the color assigned to this user.
		getUserColor: function(userID) {
			return colours[userID];
		},
		
		//runs a javascript file, specified by path, in the current context.
		includeConstants: function(path) {
			runScript(path);
		},
		
		// maps [object, operation] to the corresponding message.
		getMessage: function(object, operation) {
			return messageMap[object][operation];
		},
		
		// generates a random file name with the specified prefix and extension.
		randomFileName: function(prefix, extension) {
			return  prefix + "-" + new Date().getTime() + "." + extension;
		},
		
		// returns testsOrder array.
		getTestsOrder: function() {
			return testsOrder;
		},
		
		// calculates factorial of n.
		factorial: function(n) {
			if(n<=1) 
				return 1;

			var ret = 1;
			for(var i = 2; i <= n; i++)
				ret *= i;

			return ret;			 			
		},
		
		// return n'th permutation of a list of items.
		getNthPermutation: function(items, n) {
		    var src = items.slice(), 
		    dest = [], 
		    item;
		    
		    for (var i = 0; i < items.length; i++) {
		        item = n % src.length;
		        n = Math.floor(n / src.length);
		        dest.push(src[item]);
		        src.splice(item, 1);
		    }
		    return dest;
		}						
	};
	
	function isDuplicate(list, item, len) {
		for (var i = 0; i < len; i++)
			if (list[i] == item)
				return true;
		return false;
	}
	
	function getTestInfo(testID) {
		for (var i = 0; i < tests.length; i++) {
			if (tests[i].id == testID) {
				return tests[i];
			}
		}
		return null;
	}

	function getTestInfoByName(testName) {		
		for (var i = 0; i < tests.length; i++) {			
			if (tests[i].name == testName.trim()) {
				return tests[i];
			}
		}
		return null;
	}

	function getTestIdByName(name) {
		info = getTestInfoByName(name);
		if (!info) {
			throw new Error('Unknown item in tests order in the database: '+name);
		}
		return info.id; 
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
	
	function loadTestsOrder() {		
		if (context != undefined) {
			// if user is specified, load order from redis DB, otherwise load it from mysql DB.
			if (context.session == undefined)
				context.db.getTestsOrder(dbSetTestsOrder);
			else
				context.rdb.getTestsOrder(context.session.TeamID, rdbSetTestsOrder);			
		}			
	}

	// loads order from myql DB and adds practice area(PRAC_AREA) and end page (END_TEST) to the order.
	function dbSetTestsOrder(order) {		
		testsOrder[0] = PRAC_AREA;
		for (var i = 0; i < order.length; i++) {
			testsOrder[i+1] = getTestIdByName(order[i]);
			if (isDuplicate(testsOrder, testsOrder[i+1], i+1))
				throw Error('Duplicate items in tests order: '+order[i]);
		}
		testsOrder[i+1] = END_TEST;
		if (testsOrder.length > order.length)
			testsOrder = testsOrder.splice(0, i+2);
	}
	
	function rdbSetTestsOrder(order) {
		testsOrder = order;
	}
	
		
};