var app = require('express')();
var http = require('http').Server(app);

app.get('/', function(req, res){
  res.sendfile('index.html');
});

http.listen(4000, function(){
  console.log('listening on *:3000');
});