
// --> socket.emit('adminRequest')...
// <-- socket.on('adminResponse')...

socket.on("adminResponse", function(data) {

	alert("Done");

});

socket.on('totalUsersUpdate', function(data) {

	totalUsers = data;
	document.getElementById('totalUsersButton').innerHTML = ('All Clients: ' + (totalUsers - 1) );

});


// --> socket.emit('minMaxRequestValues')...
// <-- socket.on('minMaxResponseValues')...

socket.on("minMaxResponseValues", function(response) {

	$('input[name="minscreen"]').val(response.min);
	
	$('input[name="maxscreen"]').val(response.max);

});


// --> socket.emit('minMaxRequestUpdate')...
// <-- socket.on('minMaxResponseUpdate')...

socket.on("minMaxResponseUpdate", function(response) {

	if(response == "false") alert("Those min/max values aren't valid. Try again");
	else alert("Min/Max updated to all clients in the system");
	
});

