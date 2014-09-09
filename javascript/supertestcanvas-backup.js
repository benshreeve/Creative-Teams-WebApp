// Working Arrays (edited by the canvas script)
var clickX_simple = new Array();
var clickY_simple = new Array();
var clickDrag_simple = new Array();

var paint_simple;
var canvas_simple;
var context_simple;

/*
var canvasWidth = 1208;
var canvasHeight = 980;
*/

var canvasWidth = $('body').innerWidth();
var canvasHeight = $('body').innerHeight();

var isMouseDown = false;

function prepareSimpleCanvas() {
	var canvasDiv = document.getElementById('canvasDiv');
	canvas_simple = document.createElement('canvas');
	canvas_simple.setAttribute('width', canvasWidth);
	canvas_simple.setAttribute('height', canvasHeight);
	canvas_simple.setAttribute('id', 'canvasSimple');
	canvas_simple.style.display = 'block';
	//canvas_simple.style.margin = '15px 0';
	canvasDiv.appendChild(canvas_simple);
	if(typeof G_vmlCanvasManager != 'undefined') {
		canvas_simple = G_vmlCanvasManager.initElement(canvas_simple);
	}
	context_simple = canvas_simple.getContext("2d");
	
	// Events for touch screens
	canvas_simple.addEventListener("touchstart", doTouchStart, false);
    canvas_simple.addEventListener("touchmove", doTouchMove, true);
    canvas_simple.addEventListener("touchend", doTouchEnd, false);
	
	// Events for mice
	canvas_simple.addEventListener("mousedown", doMouseDown, false);
	canvas_simple.addEventListener("mousemove", doMouseMove, false);
	canvas_simple.addEventListener("mouseup", doMouseUp, false);
	canvas_simple.addEventListener("mouseleave", doMouseLeave, false);	
	canvas_simple.addEventListener("mouseover", doMouseOver, false);
	
	
	// Initial state - Mouse/Finger down on canvas:
	function doTouchStart() {
	
		//document.getElementById('pagetitle').innerHTML = 'TouchStart';
		
		/*
		var touchX = e.targetTouches[0].pageX - this.offsetLeft;
		var touchY = e.targetTouches[0].pageY - this.offsetTop;

		// TRY FALSE
		
		redrawSimple();
		
		*/
		if(!paint_simple) {
			addClickSimple(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, false);
			//paint_simple = true;
		}
		doTouchMove()
	};
	
	function doMouseDown(e) {
		var mouseX = e.pageX - this.offsetLeft;
		var mouseY = e.pageY - this.offsetTop;
		
		paint_simple = true;
		addClickSimple(mouseX, mouseY, false);
		redrawSimple();	
	};
	
	
	// Moving state - Mouse/Finger moving from point to point:
	function doTouchMove(e) {
		if (!e) var e = event;
		event.preventDefault();
		
		//document.getElementById('pagetitle').innerHTML = '<< TouchMove >>';
		
		var touchX = e.targetTouches[0].pageX - this.offsetLeft;
		var touchY = e.targetTouches[0].pageY - this.offsetTop;
		
		//paint_simple = true;
		if(!paint_simple) {
			addClickSimple(touchX, touchY, false);
			paint_simple = true;
		}
		else {
			addClickSimple(touchX, touchY, true);
		}
		redrawSimple();
	};
	
	function doMouseMove(e) {
		if(paint_simple){		
			isMouseDown = true;
			addClickSimple(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
			redrawSimple();
		}	
	};
	
	// End state - Mouse/Finger now out of the canvas.
	function doTouchEnd() {
		paint_simple = false;
	  	redrawSimple();	
		//document.getElementById('pagetitle').innerHTML = 'TouchEnd';
	};
	
	function doMouseUp(e) {
		paint_simple = false;
	  	redrawSimple();	
	};
	
	function doMouseLeave(e) {
		if(isMouseDown) paint_simple = true;
		else paint_simple = false;
	};
	
	function doMouseOver(e) {
		if(isMouseDown) paint_simple = true;
		else paint_simple = false;
		
	};
	
	
	$('#clearCanvasSimple').mousedown(function(e)
	{
		clickX_simple = new Array();
		clickY_simple = new Array();
		clickDrag_simple = new Array();
		clearCanvas_simple(); 
	});
}

function addClickSimple(x, y, dragging) {
	clickX_simple.push(x);
	clickY_simple.push(y);
	clickDrag_simple.push(dragging);
}

function clearCanvas_simple() {
	context_simple.clearRect(0, 0, canvasWidth, canvasHeight);
}

function redrawSimple() {
	clearCanvas_simple();
	
	var radius = 5;
	context_simple.strokeStyle = "#006296";
	context_simple.lineJoin = "round";
	context_simple.lineWidth = radius;
			
	for(var i=0; i < clickX_simple.length; i++) {		
		context_simple.beginPath();
		if(clickDrag_simple[i] && i){
			context_simple.moveTo(clickX_simple[i-1], clickY_simple[i-1]);
		}else{
			context_simple.moveTo(clickX_simple[i]-1, clickY_simple[i]);
		}
		context_simple.lineTo(clickX_simple[i], clickY_simple[i]);
		context_simple.closePath();
		context_simple.stroke();
	}
	
	// Print Output to output divs after redraw
	document.getElementById('clickDragOut').innerHTML = 'clickDrag: ' + clickDrag_simple.toString();
	document.getElementById('clickXOut').innerHTML = 'clickX: ' + clickX_simple.toString();	
	document.getElementById('clickYOut').innerHTML = 'clickY: ' + clickY_simple.toString();
}

function switchBackground() {
	canvas_simple.style.background = 'url(http://www.clker.com/cliparts/Q/y/a/d/N/Y/white-egg.svg) no-repeat center ';
}

function printTest() {
	clickX_simple = '547,547,545,543,540,537,536,536,539,550,561,573,587,604,623,636,649,654,654,649,638,622,611,602,593,588,585'.split(',');
	clickY_simple = '332,332,334,338,347,357,369,384,398,413,421,425,425,425,415,402,380,360,343,319,297,275,262,252,246,241,240'.split(',');
	clickDrag_simple = 'false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true'.split(',');
	redrawSimple();
}

function showOutput() {
	document.getElementById("arrayOutput").style.display = 'inline'; 
}