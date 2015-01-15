var bgImagePath = "../images/pictureconstruction/";
var bgImage;
var shape;
var paper;
var rect;

function getBGImageName(bgImageName) {
	return bgImagePath +  bgImageName + ".svg";
}
	
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
	prepareCanvasForSnapshot(getBGImageName(bgImage), sendResults);
});

function sendResults() {
	socket.emit(GET_RESULTS_RSP, {"screenNumber": screenNumber, "image":canvasSimple.toDataURL('image/png'), "title": document.getElementById('titleArea').value});
}

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
	if (rsp.testState.PicConBGImage != "") {
		prepareCanvas(getBGImageName(rsp.testState.PicConBGImage));
		socket.emit(GET_TRANSACTIONS_REQ);
		bgImage = rsp.testState.PicConBGImage;
	} else {
		prepareCanvas();
		setupShape();
		socket.emit(PERM_REQ, CREATE_BACKGROUND);
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
	console.log("PERM_RSP: ", rsp);
	switch (rsp.operation) {
	case EDIT_TITLE:
		if (rsp.decision == GRANTED)
			Popup.show('addTitle');
		break;
	case CREATE_BACKGROUND:
		if (rsp.decision == GRANTED) {
			shape = paper.freeTransform(rect, { keepRatio: true, scale: false }, function(ft, events) {        		
				socket.emit(MOVE_SHAPE_MSG, ft.attrs);
			});
			document.getElementById('place-shape-button').style.display = "";
		} else {
			shape = paper.freeTransform(rect, { keepRatio: true, scale: false });
			shape.hideHandles();
		}
			
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
	if (shape && data.userID != userID) {
		shape.attrs.rotate = data.rotate;
		shape.attrs.translate = data.translate;
		shape.apply();
	}
});

socket.on(BG_CREATED_MSG, function(bgImageName) {
	console.log("BG_CREATED_MSG received");
	shape.unplug();
	paper.remove();	
	document.getElementById('canvasSimple').parentNode.removeChild(document.getElementById('canvasSimple'));
	prepareCanvas(getBGImageName(bgImageName));
	bgImage = bgImageName;
});


function setupShape() {
	var canvasElement = document.getElementById('canvasSimple');
	console.log(canvasElement);
	var canvasLocation = getPosition(canvasElement);			
	paper = Raphael(canvasLocation.x, canvasLocation.y, canvasElement.width, canvasElement.height); //(0, 0, 1000, 1000);			
	rect = paper.rect(200, 100, 220, 220).attr('fill', '#feffff');
}


function sendPlaceShapeMsg() {
	document.getElementById('place-shape-button').style.display = "none";
	shape.unplug();
	svg = paper.toSVG();
	/*
	canvg(document.getElementById('canvasSimple'), svg);
	dataUrl = document.getElementById('canvasSimple').toDataURL();
	shape.unplug();
	paper.remove();
	document.getElementById('canvasSimple').parentNode.removeChild(document.getElementById('canvasSimple'));
	prepareCanvas();
	var imageObj = new Image();
    imageObj.onload = function() {
        context.drawImage(this, 0, 0);
    };
    imageObj.src = dataUrl;

	socket.emit(BG_CREATED_MSG, canvasSimple.toDataURL('image/png'));
	*/
	socket.emit(BG_CREATED_MSG, svg);
}

