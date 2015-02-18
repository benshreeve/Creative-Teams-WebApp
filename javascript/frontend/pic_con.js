var bgImage;
var shape;
var paper;
var bgShape;
var buttons=["top-left-button", "place-shape-button", "enterTitle", "demo-Button"];
var changed = false;

function getBGImageName(bgImageName) {
	return "../" + PIC_CON_BGIMAGE_PATH +  bgImageName;
}
	
socket.on(TEST_COMPLETE_MSG, function(rsp) {
	console.log("TestCompleteMsg received ...");
	Popup.show('WaitDialog');
	disableElements(buttons);	
});

socket.on(GET_RESULTS_REQ, function(rsp) {
	console.log("GetResultsReq received ...");
	if (isTitleEmpty()) {
		askForTitle("sendGetResultsRsp()");
	} else
		sendGetResultsRsp();
});

function sendGetResultsRsp() {
	if (bgImage != undefined) {
		Popup.show('WaitDialog');
		sendWaitMsg();		
		prepareCanvasForSnapshot(getBGImageName(bgImage), sendResults);
	}
	else
		sendResults();	
}

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
	document.getElementById('supertitle').style.color = COLOURS[rsp.sessionState.UserID];	
});

socket.on(GET_STATE_RSP, function(rsp) {
	console.log("GetStateRsp: ", rsp);
	storeTestState(rsp.testState);
	storeSessionState(rsp.sessionState);
	
	//set the header title	
	document.getElementById('supertitle').innerHTML = Name  + " / " + AccessCode;
	document.getElementById('supertitle').style.color = COLOURS[rsp.sessionState.UserID];	
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
			shape = paper.freeTransform(bgShape, { keepRatio: true, scale: false }, function(ft, events) {        		
				socket.emit(MOVE_SHAPE_MSG, ft.attrs);
			});
			shape.setOpts({ size: 40 });
			document.getElementById('place-shape-button').style.display = "";
		} else {
			shape = paper.freeTransform(bgShape, { keepRatio: true, scale: false });
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

socket.on(NOTIFY_TEAM_MSG, function(msg){
	switch (msg.message) {
	case WAIT_FOR_TITLE:
		Popup.hide('addTitle');
		document.getElementById("WaitMessage").innerHTML = "Help " + msg.data.name + "(" + msg.data.accessCode + ") by suggesting a title for your drawing";
	}
});

socket.on(DEMO_STOP_TIMER, function() {
	document.getElementById('demo-button').value = 'Next Test';
});

function setupShape() {
	var canvasElement = document.getElementById('canvasSimple');
	console.log(canvasElement);
	var canvasLocation = getPosition(canvasElement);			
	paper = Raphael(canvasLocation.x, canvasLocation.y, canvasElement.width, canvasElement.height); 			
	//bgShape = paper.ellipse(500, 500, 200, 100).attr('fill', '#feffff');
	bgShape = paper.path('M885.876,736.466c195.036,101.701,279.431-88.832,281.525-94.823c27.907-79.771-17.837-176.462-139.145-212.076c-155.815-45.744-292.534-30.512-318.265,8.974C627.812,564.651,885.876,736.466,885.876,736.466');
	//bgShape.attr('fill', '#feffff');
	bgShape.attr('stroke', '#010101');
	bgShape.attr('stroke-width', '6');
	bgShape.attr('stroke-miterlimit', '10');
}


function sendPlaceShapeMsg() {
	document.getElementById('place-shape-button').style.display = "none";
	shape.unplug();
	svg = paper.toSVG();
	socket.emit(BG_CREATED_MSG, svg);
	
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
}

