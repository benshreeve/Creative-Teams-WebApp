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


// Get info from the session:
socket.on('session', function (session) {

	myColour = session.sessionColour;
	groupNumber = session.sessionGroup;
	accessID = session.sessionAccessCode;
	screenNumber = session.sessionScreen;
	switchBackground(session.sessionBackground);
	collaborative = session.sessionCollaborative;
    document.getElementById('supertitle').innerHTML = session.sessionNickName  + " / " + accessID;
});

// Handle draw requests.  Ignore if not in our group, screen or if this screen is not collaborative.
socket.on('mousedot', function(dot){
	if(dot.group == groupNumber && dot.screen == screenNumber && ( (dot.owner === accessID) || collaborative ) ) {
	
		var testUser;
		var testCollaborative;
		
		if(dot.owner === accessID) testUser = true; else testUser = false;
		
		if(collaborative) testCollaborative = true; else testCollaborative = false;
	
		console.log("collaborative is: " + collaborative + "(" + testCollaborative + ") and dot.owner is: " + dot.owner + " and access id is: " + accessID + " (" + testUser + ")");
		addClickSimple(dot.x, dot.y, dot.drag, dot.rad, dot.colour, dot.owner);
		redraw();
	}
});
 
// Undo when we get a request:
socket.on('undo', function(dot){ undoMyLast(dot); });

// Procedure for dealing with our request:
socket.on('switchResponse', function(data) {
	if(data.response == false) alert(data.reason);
	else {
        pointsArray.length = 0;
        clearcanvas();
		switchBackground(data.bgimage);
		if(data.reason=="next" && (screenNumber+1 <= data.max)) screenNumber++;
		else if(data.reason=="back") screenNumber--;
		collaborative = JSON.parse(data.collaborative);
		
		alert("This is screen " + screenNumber + " and it's setting for collaborative is " + collaborative);
		
		var testCollaborative;
		
		if(collaborative) testCollaborative = true;
		else testCollaborative = false;
		
		alert("And collaborative evaluated to " + testCollaborative); 
	}
});

// Ask the server if we can move forward or backward:
function switchIntention(intention) {
	socket.emit('switchRequest', { intention:intention, screenNumber:screenNumber });
}

function stateSession() {
	socket.emit('requestSession');
}

socket.on('sessionRequest', function(session) {
	myColour = session.sessionColour;
	groupNumber = session.sessionGroup;
	accessID = session.sessionAccessCode;
	screenNumber = session.sessionScreen;
	switchBackground(session.sessionBackground);
	alert("Session variables are; NickName: " + session.sessionNickName + ", and colour is: " + session.sessionColour);
});




setTimeout(function() {
   if(myColour == "black") location.reload(); 
}, 3000);

	
function pushToSocket(type, data) {
	if(type== "draw" || type=="erase") {
		addClickSimple(data.x, data.y, data.drag, data.rad, data.colour, data.owner);
		socket.emit('mousedot', data); 
		redraw(); }
	else if (type=="undo"){
		undoMyLast(data);
		socket.emit(type, data);
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
	pointsArray.push({"x":x, "y":y, "drag":dragging, "radius":strokeradius, "colour":colour, "active":"1", "owner":owner });
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
	    for(var i=(pointsArray.length-1); i>=lastLength; i--) {	
			
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
	console.log("background is: " + url);
	if(url) canvasDiv.style.background = 'url(' + url + ') no-repeat center ';
	else canvas.style.background = "white"; 
}

function resetCache() {
	lastLength = 0;
	clearcanvas();
	redraw();
}

function undoMyLast(colour) {
    //alert("break 1")
	for(var i=(pointsArray.length -1); i>=0; i--) {
       // alert("break 2")
		if( ((pointsArray[i].colour == colour) && (pointsArray[i].active == "1")) || 
			( pointsArray[i].colour == "rgba(0,0,0,1)" && pointsArray[i].owner == accessID && pointsArray[i].active == "1" )) {
           // alert("break 3")
			pointsArray[i].active = "0";
			resetCache();
			break;
		}
	}
   // alert("end")
}

function redo() {
	for(i=lastUndone; i<clickActive_simple.length; i++) {
		if(clickActive_simple[i] == '0') {
			clickActive_simple[i] = '1';
			break;
		} }
	resetCache();
}

function eraseLite(x, y, dragging) {
	if(isErasing) {
		circleDiv.style.top = (y - eraserRadius + 100) + "px";
		circleDiv.style.left = (x - eraserRadius) + "px";	
		pushToSocket("erase", { x: x, y: y, drag: false, rad: eraserRadius, colour: "rgba(0,0,0,1)", owner: accessID, group: groupNumber, screen: screenNumber });
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