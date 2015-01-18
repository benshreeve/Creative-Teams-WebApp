var changed = false;

socket.on(UPDATE_TIME_MSG, function(time){
	remainingTime = calculateRemainingTime(time);
	document.getElementById('timeRemained').innerHTML = remainingTime.min + ":" + remainingTime.sec + " remaining";
});


socket.on(TEST_COMPLETE_MSG, function(rsp) {
	console.log("TestCompleteMsg received ...");
});

socket.on(GET_RESULTS_REQ, function(rsp) {
	console.log("GetResultsReq received ...");
	sendResults();
});

function sendResults() {
	socket.emit(GET_RESULTS_RSP, {"screenNumber": screenNumber, "image":canvasSimple.toDataURL('image/png'), "title": document.getElementById('titleArea').value});
}

socket.on(CHANGE_SCREEN_MSG, function(newScreen) {
	console.log("CHANGE_SCREEN_MSG received ...", newScreen);
	changed = false;
	Popup.hide('WaitDialog');
	screenNumber = newScreen;
	changeScreen();
	showScreenNumber(DES_CHAL_MAX_SCREEN);	
});

socket.on(GET_TEST_STATE_RSP, function(rsp) {
	console.log("GetTestStateRsp: ", rsp);
	storeTestState(rsp);	
	prepareCanvas();
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
	prepareCanvas();
	socket.emit(GET_TRANSACTIONS_REQ);

	document.getElementById('supertitle').innerHTML = Name  + " / " + AccessCode;	
	showScreenNumber(DES_CHAL_MAX_SCREEN);
});


socket.on(TITLE_BEING_EDITED_MSG, function(rsp) {
	handleTitleBeingEdited(rsp);	
});

socket.on(UPDATE_TITLE_MSG, function(rsp) {
	changed = true;
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

socket.on(END_DATA_MSG, function(){
	changed = false;
});


socket.on(WAIT_MSG, function() {
	console.log("WAIT_MSG received ...");
	Popup.show('WaitDialog');
});

function sendRequestToNextScreen() {
	if (screenNumber < DES_CHAL_MAX_SCREEN) {
		if (changed) 
			sendWaitMsg();
		sendNextScreenMsg();
	}
}

function sendNextScreenMsg() {
	if (changed)
		socket.emit(NEXT_SCREEN_MSG, {"status": CHANGED, "screenNumber": screenNumber, "image":canvasSimple.toDataURL('image/png'), "title": document.getElementById('titleArea').value});
	else 
		socket.emit(NEXT_SCREEN_MSG, {"status": UNCHANGED, "screenNumber": screenNumber});		
}

function sendRequestToPrevScreen() {
	if (screenNumber > 1) {
		if (changed) 
			sendWaitMsg();
		sendPrevScreenMsg();
	}
}

function sendPrevScreenMsg() {
	if (changed) 
		socket.emit(PREV_SCREEN_MSG, {"status": CHANGED, "screenNumber": screenNumber, "image":canvasSimple.toDataURL('image/png'), "title": document.getElementById('titleArea').value});
	else
		socket.emit(PREV_SCREEN_MSG, {"status": UNCHANGED, "screenNumber": screenNumber});
}
