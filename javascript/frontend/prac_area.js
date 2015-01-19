socket.on(UPDATE_TIME_MSG, function(time){
	if (calculateRemainingTime) {
		remainingTime = calculateRemainingTime(time);	
		if (document.getElementById('timeRemained'))
			document.getElementById('timeRemained').innerHTML = remainingTime.min + ":" + remainingTime.sec + " remaining";
	}
});


socket.on(TEST_COMPLETE_MSG, function(rsp) {
	console.log("TestCompleteMsg received ...");
	document.getElementById('top-right-button').style.display = "";
});


socket.on(GET_TEST_STATE_RSP, function(rsp) {
	console.log("GetTestStateRsp: ", rsp);
	storeTestState(rsp);
});

socket.on(GET_SESSION_STATE_RSP, function(rsp) {
	console.log("GetSessionStateRsp: ", rsp);
	storeSessionState(rsp);
	prepareCanvas();
	
	//set the header title	
	document.getElementById('supertitle').innerHTML = Name  + " / " + AccessCode;	
	
	if(!rsp.Late){		
		document.getElementById('top-right-button').style.display = "none";
	}
	else
	{		
		document.getElementById('top-right-button').style.display = "";
		document.getElementById('top-right-button').value = 'Take me to the test';
	}
});

socket.on(GET_STATE_RSP, function(rsp) {
	console.log("GetStateRsp: ", rsp.testState, rsp.sessionState);
	storeTestState(rsp.testState);	
	storeSessionState(rsp.sessionState);
	prepareCanvas();
	
	//set the header title	
	document.getElementById('supertitle').innerHTML = Name  + " / " + AccessCode;	
	
	if(!rsp.sessionState.Late){		
		document.getElementById('top-right-button').style.display = "none";
	}
	else
	{		
		document.getElementById('top-right-button').style.display = "";
		document.getElementById('top-right-button').value = 'Take me to the test';
	}
});


socket.on(TITLE_BEING_EDITED_MSG, function(rsp) {
	handleTitleBeingEdited(rsp);	
});

socket.on(UPDATE_TITLE_MSG, function(rsp) {
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
	handleUndo(rsp);
});

//When received redo
socket.on(REDO_MSG, function(rsp) {
	handleRedo(rsp);
});

socket.on(DRAW_MSG, function(dot){
	addClickSimple(dot.OperationData.x, dot.OperationData.y, dot.OperationData.drag, dot.OperationData.rad, COLOURS[dot.userID], dot.userID);
	redraw();	
});

socket.on(ERASE_MSG, function(dot){	
	addClickSimple(dot.OperationData.x, dot.OperationData.y, dot.OperationData.drag, dot.OperationData.rad, "rgba(0,0,0,1)", dot.userID);//rgba(0,0,0,1)
	redraw();	
});
