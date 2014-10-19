
// --> socket.emit('adminRequest')...
// <-- socket.on('adminResponse')...

socket.on("adminResponse", function(data) {

	alert("Done");

});

socket.on('totalUsersUpdate', function(data) {

	totalUsers = data;

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

	alert("Updated - " + response);

});

