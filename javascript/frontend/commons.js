var pointsArray = [];
var painting;
var canvas;
var context;
var lastLength = 0;
var lastUndone;
var isMouseDown = false;
var isErasing = false;
var eraserRadius = 50;
var radius = 6;
var tabState = 'paint';

var body = $('body');
var canvasWidth = (body.innerWidth() * 2);
var canvasHeight = (body.innerHeight() * 2);
var circleDiv = document.getElementById('circle');
var canvasDiv = document.getElementById('canvasDiv');

// Default Instance Information:
var screenNumber = 2;
var myColour = "black";
var accessID;
var groupNumber;
var collaborative = true;
var bgimage;
var drawable = "true";

var minScreen = 2;
var maxScreen = 2;
var backendReady = false;

var totalTestTime = 0;
var startTime = 0;
var currentTime = 0;
var remainTime = 0;
var Name = "";
var AccessCode = "";
var undoArray = [];

socket.on('UpdateTimeMsg', function(time){
	console.log("time received from backend: ", time);	
	remainTime =  parseInt(totalTestTime - (time-startTime)/1000);	
	if(remainTime >= 0){
		remainMin = parseInt(remainTime/60);
		remainSec =  parseInt(remainTime%60);
		if (remainSec.toString().length == 1) {
			remainSec = "0" + remainSec;
		}
		document.getElementById('timeRemained').innerHTML = remainMin + ":" + remainSec + " remaining";
	
	}	
});

function updateTimer(){
	if(remainTime >= 0)
	{
		remainTime = remainTime-1;	
		remainMin = parseInt(remainTime/60);
		remainSec =  parseInt(remainTime%60);
		if (remainSec.toString().length == 1) {
			remainSec = "0" + remainSec;
		}
		document.getElementById('timeRemained').innerHTML = remainMin + ":" + remainSec + " remaining";		
	}
	else{
		document.getElementById('timeRemained').innerHTML = "Practice time over";	
		document.getElementById('top-right-button').style.display = "";
	}
	checkAddEditTitle();	
}

function checkAddEditTitle(){
	if(document.getElementById('titleArea').value != ""){
		if(document.getElementById('enterTitle').style.color!="red")
			document.getElementById('enterTitle').value = "Edit Title";
	}
	else{
		if(document.getElementById('enterTitle').style.color!="red")
			document.getElementById('enterTitle').value = "Add Title";
	}	
}

socket.on('BackendReadyMsg', function(rsp) {
	console.log("BackendReadyMsg received ...");	
});

socket.on('TestCompleteMsg', function(rsp) {
	console.log("TestCompleteMsg received ...");
	document.getElementById('top-right-button').style.display = "";
	// make the next test button appear
	
});

socket.on('GetResultsReq', function(rsp) {
	console.log("GetResultsReq received ...");
	var image = canvasSimple.toDataURL('image/png');
	var title = "title"
	socket.emit('GetResultsRsp', {"image":image, "title": title});
});

socket.on('GetTestStateRsp', function(rsp) {	
	startTime = rsp.StartTime
	currentTime = rsp.StartTime		
	totalTestTime = rsp.TestTime/1000;	
	document.getElementById('timeRemained').innerHTML = "Contact server";
	var myVar = setInterval(function(){ 
	updateTimer() ;
	}, 1000);
});

socket.on('GetSessionStateRsp', function(rsp) {
	console.log("GetSessionStateRsp: ", rsp);	
	Name = rsp.Name;
	AccessCode = rsp.AccessCode;
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

socket.on('PermRsp', function(rsp) {
	console.log("PermRsp: ", rsp);
});

socket.on('TitleBeingEditedMsg', function(rsp) {
	console.log("TITLE_BEING_EDITED_MSG: ", rsp);
	if(Name != rsp.editingUser){
		//document.getElementById('supertitle').innerHTML = "Title is being edited by " + rsp.editingUser;
		//document.getElementById('enterTitle').style.display = 'none';
		document.getElementById('enterTitle').value = "Editing by " + rsp.editingUser;
		document.getElementById('enterTitle').style.color="red";
	}
	
});

socket.on('UpdateTitleMsg', function(rsp) {
	console.log("UPDATE_TITLE_MSG: ", rsp);
	//update title for everyone
	if(document.getElementById('titleArea')){
		document.getElementById('titleArea').value = rsp;
		//document.getElementById('supertitle').innerHTML = Name  + " / " + AccessCode;
		//document.getElementById('enterTitle').style.display = '';
		document.getElementById('enterTitle').value = "Add Title";
		document.getElementById('enterTitle').style.color="grey";
	}
	checkAddEditTitle();		
});

socket.on('GotoMsg', function(rsp) {
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
	var i;
	for(i = pointsArray.length - 1; i >=0; i--){
		point = pointsArray[i];			
		if(point.owner == rsp.userID){
			pointsArray.splice(i, 1);
			undoArray.push(point);			
			if(point.drag == false){				
				break;		
			}
		}
	}	
	resetCache();	
});

//When received redo
socket.on(REDO_MSG, function(rsp) {	
	var i;
	var realDrag = false;
	for(i = undoArray.length - 1; i >=0; i--){
		point = undoArray[i];		
		if(point.owner == rsp.userID){						
			if(point.drag == false && realDrag){	
				break;		
			}
			else if(point.drag == false){
				realDrag = true;
			}			
			undoArray.splice(i, 1);
			pointsArray.push(point);			
		}				
	}
	resetCache();
});

// Handle draw requests.  Ignore if not in our group, screen or if this screen is not collaborative.
socket.on('mousedot', function(dot){
		var testUser;
		var testCollaborative;		
		if(dot.owner === accessID) testUser = true; else testUser = false;		
		if(collaborative) testCollaborative = true; else testCollaborative = false;	
		console.log("collaborative is: " + collaborative + "(" + testCollaborative + ") and dot.owner is: " + dot.owner + " and access id is: " + accessID + " (" + testUser + ")");
});

socket.on(DRAW_MSG, function(dot){
	//console.log(dot);	
	if(dot.Operation == DRAW){
		addClickSimple(dot.OperationData.x, dot.OperationData.y, dot.OperationData.drag, dot.OperationData.rad, COLOURS[dot.userID], dot.userID);
	}
	else if(dot.Operation == ERASE){
		addClickSimple(dot.OperationData.x, dot.OperationData.y, dot.OperationData.drag, dot.OperationData.rad, "rgba(0,0,0,1)", dot.userID);//rgba(0,0,0,1)
	}
	redraw();	
});
 
// Procedure for dealing with our request:
socket.on('switchResponse', function(data) {
	if(data.response == false) alert(data.reason);
	else {
        pointsArray.length = 0;
        clearcanvas();
		switchBackground(data.bgimage);
		screenNumber = data.newScreenNumber;		
		collaborative = JSON.parse(data.collaborative);
		drawable = data.drawable;
		var testCollaborative;		
		if(collaborative) testCollaborative = true;
		else testCollaborative = false;
	}
});

// Ask the server if we can move forward or backward:
function switchIntention(intention) {
	//console.log("screen number sent was: " + screenNumber);
	socket.emit('switchRequest', { intention:intention, screenNumber:screenNumber });
	//undo and redo
	if(intention == 'back'){
		socket.emit(UNDO_MSG, {userID: accessID, ScreenNumber: screenNumber, ObjectID: DOT, Operation: UNDO, OperationData:{}});  		
	}
	else if(intention == 'next'){
		socket.emit(REDO_MSG, {userID: AccessCode, ScreenNumber: screenNumber, ObjectID: DOT, Operation: REDO, OperationData:{}});  		
	}
}

function stateSession() {
	
	socket.emit("GetTestStateReq");
	socket.emit("GetSessionStateReq");
	socket.emit('requestSession');	
}

socket.on('screenUpdate', function(data) {
	if(screenNumber < data.min)
		switchIntention(data.min);
	else if(screenNumber > data.max)
		switchIntention(data.max);
});

socket.on('sessionRequest', function(session) {		
	
	myColour = "red";
	groupNumber = session.TeamID;
	accessID = session.AccessCode;
	switchIntention(0);
	drawable = "true";	
});


function pollBackend() {
	console.log("polling backend ...");
	socket.emit("IsBackendReadyReq");
}

function showTitle(){	
	socket.emit('sessionTitle');
}
	
function pushToSocket(type, data) {
	//console.log("drag: data.drag " + data.drag);
	// Minh added
	if(type== "draw" && drawable=="true") {			
		socket.emit(DRAW_MSG, { ScreenNumber: screenNumber, ObjectID: DOT, Operation: DRAW, OperationData: {x: data.x, y: data.y, rad: data.rad, drag: data.drag}}); 
		redraw(); 
	}
	else if(type=="erase" && drawable=="true") {			
		socket.emit(DRAW_MSG, { ScreenNumber: screenNumber, ObjectID: DOT, Operation: ERASE, OperationData: {x: data.x, y: data.y, rad: data.rad, drag: data.drag}}); 		
		redraw(); 
	}	
}

function sleep(milliseconds) {
	  var start = new Date().getTime();
	  for (var i = 0; i < 1e7; i++) {
	    if ((new Date().getTime() - start) > milliseconds){
	      break;
	    }
	  }
	}

function prepareCanvas() {
	canvas = document.createElement('canvas');
	canvas.setAttribute('width', canvasWidth / 2);
	canvas.setAttribute('height', (canvasHeight - 400) / 2);
	canvas.setAttribute('id', 'canvasSimple');
	canvas.style.display = 'block';
	canvasDiv.appendChild(canvas);
	if(typeof G_vmlCanvasManager != 'undefined') canvas = G_vmlCanvasManager.initElement(canvas);
	context = canvas.getContext("2d");
	
	// Event Handlers:
	canvasSimple.addEventListener("touchstart", doTouchStart, false);
    canvasSimple.addEventListener("touchmove", doTouchMove, true);
    canvasSimple.addEventListener("touchend", doTouchEnd, false);
	canvasSimple.addEventListener("mousedown", doMouseDown, false);
	canvasSimple.addEventListener("mousemove", doMouseMove, false);
	canvasSimple.addEventListener("mouseup", doMouseUp, false);
	canvasSimple.addEventListener("mouseleave", doMouseLeave, false);	
	canvasSimple.addEventListener("mouseover", doMouseOver, false);
	
	
	
	// Fix for HD Displays:
	if(window.devicePixelRatio == 2) {
		canvas.setAttribute('width', canvasWidth / 2);
		canvas.setAttribute('height', (canvasHeight /2) - 200);
		document.getElementById('deadzone-top').style.width = "100%";
		document.getElementById('deadzone-bottom').style.width = "100%";
	}	
	
	console.log("backendReady: ", backendReady);
	// Ask for Session Details:
	
	stateSession();
	
	function doTouchStart(e) {
		var touchX = e.targetTouches[0].pageX - this.offsetLeft;
		var touchY = e.targetTouches[0].pageY - this.offsetTop;
	
		if(!isErasing && !painting) {	
			painting = true;
			pushToSocket("draw", { x: touchX, y: touchY, drag: false, rad: radius, colour: myColour, owner: accessID, group: groupNumber, screen: screenNumber });
		}
		else {
			circleDiv.style.top = (touchY - 50) + "px";
			circleDiv.style.left = (touchX - 50) + "px";
			$("#circle").stop(true, true).fadeIn();
			eraseLite(touchX, touchY, false);
		}
	};
	
	function doMouseDown(e) {
		var mouseX = e.pageX - this.offsetLeft;
		var mouseY = e.pageY - this.offsetTop;
		
		if(!isErasing) {
			painting = true;
			pushToSocket("draw", { x: mouseX, y: mouseY, drag: false, rad: radius, colour: myColour, owner: accessID, group: groupNumber, screen: screenNumber });
		}
		else {
			isMouseDown = true;
			circleDiv.style.top = (mouseY - 50) + "px";
			circleDiv.style.left = (mouseX - 50) + "px";
			eraseLite(mouseX, mouseY, false);
			$("#circle").stop(true, true).fadeIn();
		}
	};
	
	function doTouchMove(e) {
		event.preventDefault();
		var touchX = e.targetTouches[0].pageX - this.offsetLeft;
		var touchY = e.targetTouches[0].pageY - this.offsetTop;
		
		if(!isErasing) {
			if(!painting) {
				addClickSimple(touchX, touchY, false, radius,  myColour, accessID);	
				painting = true;
			}
			else pushToSocket("draw", { x: (e.targetTouches[0].pageX - this.offsetLeft), y: (e.targetTouches[0].pageY - this.offsetTop), drag: true, rad: radius, colour: myColour, owner: accessID, group: groupNumber, screen: screenNumber });
		}
		else eraseLite(touchX, touchY, true);
	};
	
	function doMouseMove(e) {
		if(painting){		
			isMouseDown = true;
			pushToSocket("draw", { x: (e.pageX - this.offsetLeft), y: (e.pageY - this.offsetTop), drag: true, rad: radius, colour: myColour, owner: accessID, group: groupNumber, screen: screenNumber });
		}
		else if(isMouseDown) eraseLite(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true); 
	};
	
	function doTouchEnd() {
		painting = false;
		$("#circle").fadeOut();
	};
	
	function doMouseUp(e) {
		painting = false;
		isMouseDown = false;
		if(isErasing) $("#circle").fadeOut();
	};
	
	function doMouseLeave(e) {
		if(isMouseDown) painting = true;
		else painting = false;
	};
	
	function doMouseOver(e) {
		if(isMouseDown == true && isErasing == false) painting = true;
		else { 
			painting = false; 
			if(isMouseDown == true) isErasing = false;
		}
	};
}

function addClickSimple(x, y, dragging, strokeradius, colour, owner) {
	pointsArray.push({"owner":owner, "x":x, "y":y, "drag":dragging, "radius":strokeradius, "colour":colour, "active":"1"});
}

function clearcanvas() {
	context.clearRect(0, 0, canvasWidth, canvasHeight);
}

window.onresize = function(event) {
     canvasWidth = body.innerWidth();
     canvasHeight = body.innerHeight();
};

function resizeCanvas() {
     canvasWidth = body.innerWidth();
     canvasHeight = body.innerHeight();
}

function redraw() {	
	if(pointsArray.length > lastLength){
	    //for(var i=(pointsArray.length-1); i>=lastLength; i--) {	
		for(var i=lastLength; i<=(pointsArray.length-1); i++) {	
			
			if(pointsArray[i].active == "1") {
				context.beginPath();	
				if(pointsArray[i].colour == "rgba(0,0,0,1)") context.globalCompositeOperation = "destination-out";
				else context.globalCompositeOperation = "source-over";			
				context.strokeStyle = pointsArray[i].colour;					
				context.lineCap = "round";
				context.lineWidth = pointsArray[i].radius;

				if ( i > 0 && (pointsArray[i].colour != pointsArray[i-1].colour) && (pointsArray[i].drag === true || pointsArray[i].drag === "true") ) {
					for(var x=i-2; x>=0; x--) {
						if(pointsArray[x].colour == pointsArray[i].colour) {
							context.moveTo( (pointsArray[i].x), (pointsArray[i].y) );
							context.lineTo(pointsArray[x].x, pointsArray[x].y);
							break;
						}
					}
				}
				else {
					if( (pointsArray[i].drag === true || pointsArray[i].drag === "true") && i) context.moveTo(pointsArray[i-1].x, pointsArray[i-1].y);
					else context.moveTo(pointsArray[i].x-1, pointsArray[i].y);
					context.lineTo(pointsArray[i].x, pointsArray[i].y);
				}
			context.stroke();
			}
		}
	}
	lastLength = pointsArray.length;
}

function switchBackground(url) {
	if (canvasDiv){
		console.log("background is: " + url);
		if(url != " " || url != "") canvasDiv.style.background = 'url(' + url + ') no-repeat center ';
		else canvas.style.background = "white";
	}	 
}

function resetCache() {
	lastLength = 0;
	clearcanvas();
	redraw();
}

function eraseLite(x, y, dragging) {
	if(isErasing) {
		circleDiv.style.top = (y - eraserRadius + 100) + "px";
		circleDiv.style.left = (x - eraserRadius) + "px";			
		pushToSocket("erase", { x: x, y: y, drag: dragging, rad: eraserRadius, colour: "rgba(0,0,0,1)", owner: accessID, group: groupNumber, screen: screenNumber });
	}
}

function switchMode(type) {
	if(type=="erase") {
		isErasing = true;
		if(tabState != 'erase') {
			$("#eraserCircle").fadeIn();
			$("#paintCircle").fadeOut();
			tabState = 'erase';
		}
	}
	else if(type=="paint") {
		isErasing = false;
		if(tabState != 'paint') {
			$("#paintCircle").fadeIn();
			$("#eraserCircle").fadeOut();
			tabState = 'paint';
		}
	}
}

function switchStroke(size, id) {
	if(id=='paintCircle') radius = size;
	else {
		eraserRadius = size;
		circleDiv.style.width = (eraserRadius * 2) + "px";
		circleDiv.style.height = (eraserRadius * 2) + "px";		
	}
	
	var startPos = 256;
	var buttonWidth = 60;
	var rightMargin = 5;
	var speed = 250;
	
	if(size==2 || size==10) { 
		$("#" + id).animate({
			left: (startPos - (buttonWidth * 2) - (rightMargin * 2))
		}, { duration: speed, queue: false });
	}
	else if(size==4 || size== 30) { 
		$("#" + id).animate({
			left: (startPos - buttonWidth - rightMargin)
		}, { duration: speed, queue: false });
	}
	else if(size==6 || size== 50) { 
		$("#" + id).animate({
			left: startPos
		}, { duration: speed, queue: false });
	}
	else if(size==9 || size==75) { 
		$("#" + id).animate({
			left: (startPos + (buttonWidth) + (rightMargin))
		}, { duration: speed, queue: false });	
	}
	else if(size==12 || size==100) { 
		$("#" + id).animate({
			left: (startPos + (buttonWidth *2) + (rightMargin * 2))
		}, { duration: speed, queue: false });		
	}
}