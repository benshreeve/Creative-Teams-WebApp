/**
 * Author: Habib Naderi
 * Department of Computer Science, University of Auckland
 * 
 * This module implements required functions and message handlers for Picture Completion test.
 */

var bgImagePath = "/assets/images/picturecompletion/TTCT_Fig_Parts_Figure_";
var changed = false;
var changeScreenInProgress = false;
var getResultsReqReceived = false;
var buttons = ["top-left-button", "next-button", "prev-button", "enterTitle", "demo-button"];
var testComplete = false;

function getBGImageName() {
	return bgImagePath + screenNumber + ".svg" + VERSION;
}

socket.on(TEST_COMPLETE_MSG, function(rsp) {
	console.log("TestCompleteMsg received ...");
	testComplete = true;
	//Popup.show('WaitDialog');
	//Popup.hideAll();
	disableElements(buttons);
});

socket.on(GET_RESULTS_REQ, function(rsp) {
	console.log("GetResultsReq received ...");
	sendGetResultsRsp();	
});

function sendGetResultsRsp() {
	if (!changeScreenInProgress)
		if (isTitleEmpty() && changed) 
			askForTitle("sendGetResultsRsp()");
		else {
			Popup.show('WaitDialog');
			sendWaitMsg();
			prepareCanvasForSnapshot(getBGImageName(), sendResults);
		}
	else {
		getResultsReqReceived = true;
	}	
}

function sendResults() {
	socket.emit(GET_RESULTS_RSP, {"screenNumber": screenNumber, "image":canvasSimple.toDataURL('image/png'), "title": document.getElementById('titleArea').value});
}

socket.on(CHANGE_SCREEN_MSG, function(newScreen) {
	changeScreenInProgress = true;
	console.log("CHANGE_SCREEN_MSG received ...", newScreen);
	screenNumber = newScreen;
	changeScreen(getBGImageName());
	showScreenNumber(PIC_COMP_MAX_SCREEN);	
	changed = false;
});

socket.on(GET_STATE_RSP, function(rsp) {
	console.log("GetStateRsp: ", rsp.testState, rsp.sessionState);
	storeTestState(rsp.testState);	
	storeSessionState(rsp.sessionState);
	prepareCanvas(getBGImageName());
	socket.emit(GET_TRANSACTIONS_REQ);

	document.getElementById('supertitle').innerHTML = Name  + " / " + AccessCode;	
	document.getElementById('supertitle').style.color = COLOURS[rsp.sessionState.UserID];	
	showScreenNumber(PIC_COMP_MAX_SCREEN);
});


socket.on(TITLE_BEING_EDITED_MSG, function(rsp) {
	handleTitleBeingEdited(rsp);	
});

socket.on(UPDATE_TITLE_MSG, function(rsp) {
//	changed = true;
	handleUpdateTitle(rsp);
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

//When received undo
socket.on(UNDO_MSG, function(rsp) {
	changed = true;
	handleUndo(rsp);
});

//When received redo
socket.on(REDO_MSG, function(rsp) {
	changed = true;
	handleRedo(rsp);
});

socket.on(DRAW_MSG, function(dot){
	changed = true;
	addClickSimple(dot.OperationData.x, dot.OperationData.y, dot.OperationData.drag, dot.OperationData.rad, COLOURS[dot.userID], dot.userID);
	redraw();	
});

socket.on(ERASE_MSG, function(dot){
	changed = true;
	addClickSimple(dot.OperationData.x, dot.OperationData.y, dot.OperationData.drag, dot.OperationData.rad, "rgba(0,0,0,1)", dot.userID);//rgba(0,0,0,1)
	redraw();	
});

socket.on(END_DATA_MSG, function() {
	changeScreenInProgress = false;	
	if (getResultsReqReceived) {
		getResultsReqReceived = false;
		sendGetResultsRsp();
	} else if (!testComplete){
		Popup.hide('WaitDialog');
		enableElements(buttons);		
	}
	changed = false;
});


socket.on(WAIT_MSG, function(data) {
	console.log("WAIT_MSG received ...");
	if (data.userID != userID)
		Popup.show('WaitDialog');
	disableElements(buttons);
});

socket.on(NOTIFY_TEAM_MSG, function(msg){
	console.log("NOTIFY_TEAM_MSG received ...", msg);
	switch (msg.message) {
	case WAIT_FOR_TITLE:
		Popup.hide('addTitle');
		if (msg.userID != userID) {
			Popup.hide('askForTitle');			
			document.getElementById("WaitMessage").innerHTML = "Help " + msg.data.name + "(" + msg.data.accessCode + ") by suggesting a title for your drawing";
			Popup.show('WaitDialog');
		}
		break;
	}
});

socket.on(DEMO_STOP_TIMER, function() {
	document.getElementById('demo-button').value = 'Next Test';
});

function sendRequestToNextScreen() {
	if (screenNumber < PIC_COMP_MAX_SCREEN) {
		changeScreenInProgress = true;
		disableElements(buttons);		
		sendWaitMsg();
		Popup.show('WaitDialog');		
		if (changed) {			
			prepareCanvasForSnapshot(getBGImageName(), sendNextScreenMsg);
		} else {
			sendNextScreenMsg();
		}
	}
}

function sendRequestToPrevScreen() {
	if (screenNumber > 1) {
		changeScreenInProgress = true;
		disableElements(buttons);		
		sendWaitMsg();
		Popup.show('WaitDialog');		
		if (changed) {
			prepareCanvasForSnapshot(getBGImageName(), sendPrevScreenMsg);
		} else {
			sendPrevScreenMsg();
		} 
	}
}
