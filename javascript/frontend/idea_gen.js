var currentSelection = 0;
var buttons = ["submit-button", "cancel-button", "delete-button", "top-left-button", "demoButton"];

socket.on(TEST_COMPLETE_MSG, function(rsp) {
	console.log("TestCompleteMsg received ...");
	Popup.show('WaitDialog');
	disableElements(buttons);	
});

socket.on(GET_RESULTS_REQ, function(rsp) {
	console.log("GetResultsReq received ...");
	var rows = document.getElementById('ideaTable').rows;
	var res=[];
	for (i = 1; i < rows.length; i++) {
		res.push({title: rows[i].cells[0].innerHTML, description: rows[i].cells[1].innerHTML,
				  userID: rows[i].name, ideaNo: i});
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
	document.getElementById('supertitle').style.color = COLOURS[rsp.UserID];
});

socket.on(GET_STATE_RSP, function(rsp) {
	console.log("GetStateRsp: ", rsp.testState, rsp.sessionState);
	storeTestState(rsp.testState);	
	storeSessionState(rsp.sessionState);
	socket.emit(GET_TRANSACTIONS_REQ);

	document.getElementById('supertitle').innerHTML = Name  + " / " + AccessCode;	
	document.getElementById('supertitle').style.color = COLOURS[rsp.sessionState.UserID];	
});


socket.on(GOTO_MSG, function(rsp) {
	console.log("GOTO_MSG: ", rsp);
	window.location.href = rsp;
});

//When there are some response from backend
socket.on(PERM_RSP, function(rsp) {	
	if(rsp.decision == GRANTED && rsp.operation == EDIT_TITLE) {		
		Popup.show('addTitle');
	}	
});

socket.on(END_DATA_MSG, function(){
	changed = false;
});

socket.on(ADD_IDEA_MSG, function(idea) {
	addIdea(idea);
});

socket.on(DEL_IDEA_MSG, function(idea) {
	delIdea(idea);
});

socket.on(UPDATE_IDEA_MSG, function(idea) {
	updateIdea(idea);
});

socket.on(DEMO_STOP_TIMER, function() {
	document.getElementById('demo-button').value = 'Next Test';
});


function sendAddIdea() {
	ideaText = document.getElementById("idea-title-textfield").value.trim();
	descriptionText = document.getElementById("idea-description-textfield").value.trim();
	
	if (ideaText != "" && descriptionText != "") {
		ideaTransaction = {ScreenNumber: 1, ObjectID: IDEA, Operation: ADD, OperationData: {title: ideaText, description:descriptionText, id:0}};
		socket.emit(ADD_IDEA_MSG, ideaTransaction);
		document.getElementById("idea-title-textfield").value = "";
		document.getElementById("idea-description-textfield").value = "";		
	}
}

function addIdea(idea) {
	var table = document.getElementById("ideaTable");
	
	// Create an empty <tr> element and add it to the 1st position of the table:
	var row = table.insertRow(-1);
	row.id = idea.OperationData.id;
	row.name = idea.userID;
	
	if (row.name == userID) {
		row.onclick = function() {
			gotoEditMode(this.id)
		}
		row.style.font = "bold 25px arial,serif";
	} else
		row.style.font = "italic 25px arial,serif";
	
		// Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
	var cell1 = row.insertCell(0);
	var cell2 = row.insertCell(1);

	row.style.color = COLOURS[row.name];
						
	// Add some text to the new cells:
	cell1.innerHTML = idea.OperationData.title;
	cell2.innerHTML = idea.OperationData.description;		
}

function sendDelIdea() {
	ideaTransaction = {ScreenNumber: 1, ObjectID: IDEA, Operation: DEL, OperationData: {id:currentSelection}};
	socket.emit(DEL_IDEA_MSG, ideaTransaction);
	gotoAddMode();
}

function delIdea(idea) {	
	var m = document.getElementById(idea.OperationData.id).rowIndex;
	document.getElementById("ideaTable").deleteRow(m);
}

function sendUpdateIdea() {
	ideaText = document.getElementById("idea-title-textfield").value.trim();
	descriptionText = document.getElementById("idea-description-textfield").value.trim();

	if (ideaText != "" && descriptionText != "") {
		ideaTransaction = {ScreenNumber: 1, ObjectID: IDEA, Operation: UPDATE, OperationData: {title: ideaText, description:descriptionText, id:currentSelection}};
		socket.emit(UPDATE_IDEA_MSG, ideaTransaction);
		gotoAddMode();
	}
}

function updateIdea(idea) {	
	id = idea.OperationData.id;
	document.getElementById(id).cells[0].innerHTML = idea.OperationData.title;
	document.getElementById(id).cells[1].innerHTML = idea.OperationData.description;	
}

function sendAddUpdateIdea() {
	if (document.getElementById("submit-button").value == "Add")
		sendAddIdea();
	else
		sendUpdateIdea();
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
	document.getElementById("idea-title-textfield").value = row.cells[0].innerHTML;
	document.getElementById("idea-description-textfield").value = row.cells[1].innerHTML;	
}

function gotoAddMode() {
	document.getElementById("cancel-button").style.display = "none";
	document.getElementById("delete-button").style.display = "none";
	document.getElementById("submit-button").value = "Add";			
	document.getElementById(currentSelection).style.background = "#ffffff";
	document.getElementById("idea-title-textfield").value = "";
	document.getElementById("idea-description-textfield").value = "";
	currentSelection = 0;
}

function cancelChange() {
	gotoAddMode();
}
