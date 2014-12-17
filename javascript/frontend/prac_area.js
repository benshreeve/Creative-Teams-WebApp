// JavaScript Document
var originalTitle = "";

function showIntroduction(){
	if(document.getElementById('top-left-button').value == 'Instructions'){
		document.getElementById('top-left-button').value = 'Practice Area';
		Popup.show('practiceIntro');                        
	}
}

function sendRequestToNextTest(){	
	document.getElementById('top-right-button').value = 'Waiting for server responses...';    
	socket.emit(PERM_REQ, START_TEST);  
}

function sendRequestToUpdateTitle(){
	socket.emit(PERM_REQ, EDIT_TITLE); 
	originalTitle = document.getElementById('titleArea').value;
}

function closeAndStart(){
	Popup.hideAll();
	document.getElementById('top-left-button').value = 'Instructions';
}

function saveTitle(){
	socket.emit('UpdateTitleMsg', document.getElementById('titleArea').value); 
	Popup.hideAll();
}

function cancelUpdateTitle(){
	socket.emit('UpdateTitleMsg', originalTitle); 
	Popup.hideAll();
}