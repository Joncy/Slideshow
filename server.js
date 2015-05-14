#!/usr/bin/env node

// server.js
//===========

/*
* This is where all the magic happens.
* The xway dashboard calls this script as is
* `node server.js --port <free port number>`
* after that everyline here will be executed.
*
* You can install extra modules thanks to the work
* of npm. Also you can create a shell script to
* install any missing system package.
*/

/* Requires node.js libraries */
var express = require('express'),
  multer  = require('multer'),
  sys = require('sys'),
  exec = require('child_process').exec,
  app = require('express')(),
  http = require('http').Server(app);
  

var pag;
var presen = 0;
var timer = 0;

function puts(error, stdout, stderr) { sys.puts(stdout) }
//exec("unoconv -f pdf ./presentation/*.pptx", puts);
//exec("unoconv -f pdf ./presentation/*.ppt", puts);

// xyos apps can accept the port to be launched by parameters
var argv = require('minimist')(process.argv.slice(2));
port = argv.port || 31416;

if(isNaN(port)) {
  console.log("Port \"%s\" is not a number.", port);
  process.kill(1);
}

app.use(express.static(__dirname));

var server = app.listen(port, function () {
  console.log('App listening at http://%s:%s', 
    server.address().address,
    server.address().port);
});

app.use(
  multer(
    { dest: './presentation/', 
      rename: function (fieldname, filename) {
            return filename.replace(filename, 'Presentation').toLowerCase();
        } ,
        onFileUploadComplete: function (file) {     
      }
    }
  )
)


app.post('/', function(req, res){
    console.log(req.body) // form fields
    console.log(req.files) // form files

    res.status(204).end()
});

var io = require('socket.io')(server);

io.on('connection', function(socket){
  socket.on('new page', function(page){
    io.emit('new page', page);
    pag = page;
  });

  socket.on('page?', function(page){
    io.emit('new page', pag);
  });

  socket.on('presentation?', function(presentation){
    console.log("presentation");
    io.emit('presentation', presen);
  });
  
  socket.on('close', function () {
    killPresentation();
  });

  socket.on('download', function () {
    io.emit('download-yes');
  });

  socket.on('sharing', function(){
    presen = 1;
    clearTimeout(timer);
    timer = 0;
  });
});


function killPresentation () {
  presen = 0;
  exec("rm ./presentation/*", puts);
  pag = null;
}

setInterval(function() {
  io.emit('sharing?');
  if (!timer && presen != 0) {
    timer = setTimeout(function(){
      killPresentation();
    }, 10000);
  }
}, 8000);