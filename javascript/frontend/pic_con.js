socket.on(UPDATE_TIME_MSG, function(time){
	remainingTime = calculateRemainingTime(time);
	console.log("UPDTAE_TIME_MSG: ", remainingTime.min,",", remainingTime.sec);
	document.getElementById('timeRemained').innerHTML = remainingTime.min + ":" + remainingTime.sec + " remaining";
});


socket.on(TEST_COMPLETE_MSG, function(rsp) {
	console.log("TestCompleteMsg received ...");
});

socket.on(GET_RESULTS_REQ, function(rsp) {
	console.log("GetResultsReq received ...");
	shape.unplug();
	var svg = paper.toSVG();
	canvg(document.getElementById('canvasSimple'), svg);
	console.log(document.getElementById('canvasSimple').toDataURL());
	var bg = document.getElementById('canvasSimple').toDataURL();
	socket.emit(GET_RESULTS_RSP, {image: bg, title: "habib"});
	paper.remove();
	document.getElementById('canvasSimple').parentNode.removeChild(document.getElementById('canvasSimple'));
	prepareCanvas();
	var imageObj = new Image();
    imageObj.onload = function() {
        context.drawImage(this, 0, 0);
      };
      imageObj.src = bg;

	//socket.emit(GET_RESULTS_RSP, {"image":canvasSimple.toDataURL('image/png'), "title": document.getElementById('titleArea').value});
});

socket.on(GET_TEST_STATE_RSP, function(rsp) {
	console.log("GetTestStateRsp: ", rsp);
	storeTestState(rsp);
});

socket.on(GET_SESSION_STATE_RSP, function(rsp) {
	console.log("GetSessionStateRsp: ", rsp);
	storeSessionState(rsp);
	
	//set the header title	
	document.getElementById('supertitle').innerHTML = Name  + " / " + AccessCode;		
});

socket.on(GET_STATE_RSP, function(rsp) {
	console.log("GetStateRsp: ", rsp);
	storeTestState(rsp.testState);
	storeSessionState(rsp.sessionState);
	
	//set the header title	
	document.getElementById('supertitle').innerHTML = Name  + " / " + AccessCode;		
	
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

socket.on(MOVE_SHAPE_MSG, function(data){
	var x = "s1p"+data.userID;
	console.log("MOVE_SHAPE_MSG: ", x, accessID);	
	if (x != AccessCode) {
		delete data.userID;
		console.log("apply what has been received from ", x, ":", data.rotate);
		shape.attrs.rotate = data.rotate;
		shape.attrs.translate = data.translate;
		shape.apply();
	}
});
