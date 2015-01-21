var currentSelection = 0;
var buttons = ["submit-button", "cancel-button", "delete-button", "top-left-button"];

socket.on(UPDATE_TIME_MSG, function(time){
	if (calculateRemainingTime) {
		remainingTime = calculateRemainingTime(time);	
		if (document.getElementById('timeRemained'))
			document.getElementById('timeRemained').innerHTML = remainingTime.min + ":" + remainingTime.sec + " remaining";
	}
});


socket.on(TEST_COMPLETE_MSG, function(rsp) {
	console.log("TestCompleteMsg received ...");
	Popup.show('WaitDialog');
	disableElements(buttons);
});

socket.on(GET_RESULTS_REQ, function(rsp) {
	console.log("GetResultsReq received ...");
	var rows = document.getElementById('useTable').rows;
	var res=[];
	for (i = 1; i < rows.length; i++) {
		res.push({use: rows[i].cells[0].innerHTML, userID: rows[i].name, useNo: i});
	}
	socket.emit(GET_RESULTS_RSP, res);
});

socket.on(GET_TEST_STATE_RSP, function(rsp) {
	console.log("GetTestStateRsp: ", rsp);
	storeTestState(rsp);	
	socket.emit(GET_TRANSACTIONS_REQ);
});

socket.on(GET_SESSION_STATE_RSP, function(rsp) {
	console.log("GetSessionStateRsp: ", rsp);
	storeSessionState(rsp);
	
	//set the header title	
	document.getElementById('supertitle').innerHTML = Name  + " / " + AccessCode;		
});

socket.on(GET_STATE_RSP, function(rsp) {
	console.log("GetStateRsp: ", rsp.testState, rsp.sessionState);
	storeTestState(rsp.testState);	
	storeSessionState(rsp.sessionState);
	socket.emit(GET_TRANSACTIONS_REQ);

	document.getElementById('supertitle').innerHTML = Name  + " / " + AccessCode;	
});


socket.on(GOTO_MSG, function(rsp) {
	console.log("GOTO_MSG: ", rsp);
	window.location.href = rsp;
});

socket.on(END_DATA_MSG, function(){
	changed = false;
});

socket.on(ADD_USE_MSG, function(use) {
	addUse(use);
});

socket.on(DEL_USE_MSG, function(use) {
	delUse(use);
});

socket.on(UPDATE_USE_MSG, function(use) {
	updateUse(use);
});

socket.on(DEMO_STOP_TIMER, function() {
	document.getElementById('demo-button').value = 'Next Test';
});


function sendAddUse() {
	useText = document.getElementById("use-textfield").value.trim();

	if (useText != "") {
		useTransaction = {ScreenNumber: 1, ObjectID: USE, Operation: ADD, OperationData: {use: useText, id:0}};
		socket.emit(ADD_USE_MSG, useTransaction);
	}
}

function addUse(use) {
	var table = document.getElementById("useTable");
	
	// Create an empty <tr> element and add it to the 1st position of the table:
	var row = table.insertRow(-1);
	row.id = use.OperationData.id;
	row.name = use.userID;
	
	if (row.name == userID) {
		row.onclick = function() {
			gotoEditMode(this.id)
		}
		row.style.font = "bold 25px arial,serif";
	} else
		row.style.font = "italic 25px arial,serif";
	
		// Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
	var cell = row.insertCell(0);

	row.style.color = COLOURS[row.name];
						
	// Add some text to the new cells:
	cell.innerHTML = use.OperationData.use;		
}

function sendDelUse() {
	useTransaction = {ScreenNumber: 1, ObjectID: USE, Operation: DEL, OperationData: {id:currentSelection}};
	socket.emit(DEL_USE_MSG, useTransaction);
	gotoAddMode();
}

function delUse(use) {	
	var m = document.getElementById(use.OperationData.id).rowIndex;
	document.getElementById("useTable").deleteRow(m);
}

function sendUpdateUse() {
	useText = document.getElementById("use-textfield").value.trim();

	if (useText != "") {
		useTransaction = {ScreenNumber: 1, ObjectID: USE, Operation: UPDATE, OperationData: {use: useText, id:currentSelection}};
		socket.emit(UPDATE_USE_MSG, useTransaction);
		gotoAddMode();
	}
}

function updateUse(use) {	
	id = use.OperationData.id;
	document.getElementById(id).cells[0].innerHTML = use.OperationData.use;	
}

function sendAddUpdateUse() {
	if (document.getElementById("submit-button").value == "Add")
		sendAddUse();
	else
		sendUpdateUse();
}

function gotoEditMode(id) {
	var row = document.getElementById(id);
	if (currentSelection != 0) {
		document.getElementById(currentSelection).style.background = "#ffffff" 
	}

	row.style.background = "#999999";					
	currentSelection = id;
	document.getElementById("submit-button").value = "Update";
	document.getElementById("cancel-button").style.display = "";
	document.getElementById("delete-button").style.display = "";
	document.getElementById("use-textfield").value = row.cells[0].innerHTML;	
}

function gotoAddMode() {
	document.getElementById("cancel-button").style.display = "none";
	document.getElementById("delete-button").style.display = "none";
	document.getElementById("submit-button").value = "Add";			
	document.getElementById(currentSelection).style.background = "#ffffff";
	document.getElementById("use-textfield").value = "";
	currentSelection = 0;
}

function cancelChange() {
	gotoAddMode();
}
