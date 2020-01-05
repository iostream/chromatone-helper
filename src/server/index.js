const fs = require('fs');
const http = require('http');

const host = require('./host.js');
const MIDI_FILE_PATH = __dirname + '/last_generated.midi';
const DAW_INTEGRATION_FILE_PATH = __dirname + '/daw_input.txt';

const server = http.createServer((request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  console.log(request.method + " " + request.url);

  if (request.method === "POST") {
    if (request.url === "/midi") {
      receiveUpload(MIDI_FILE_PATH, true, request, response);
    } else if (request.url === "/daw") {
      receiveUpload(DAW_INTEGRATION_FILE_PATH, false, request, response);
    } else {
      notFound(response);
    }
  }
  if (request.method === "GET") {
    if (request.url === "/daw") {
      serveFile(DAW_INTEGRATION_FILE_PATH, response);
    } else if (request.url === "/") {
      serveTool(response);
    } else {
      notFound(response);
    }
  }
});

function receiveUpload(fileName, binary, request, response) {
  var receivedText = "";
  request.on('data', chunk => {
    receivedText += chunk.toString();
  });
  request.on('end', () => {
     console.log("received text " + receivedText);
     var encoding = (binary) ? 'base64' : 'utf8';
     fs.writeFileSync(fileName, receivedText, encoding, function(error) {
       if (error) {
        response.end();
        throw error;
       }
       console.log("File was written: " + fileName);
     });
     response.statusCode = 204; // no content
     response.end();
  });
}

function serveTool(response) {
  var toolFilePath = __dirname + '/../../dist/chromatone/chromatone-combined-index.html';
  serveFile(toolFilePath, response);
}

function serveFile(filePath, response) {
  fs.readFile(filePath, "binary", function(err, file) {
    if(err) {
      response.writeHead(500, {"Content-Type": "text/plain"});
      response.write(err + "\n");
      response.end();
      return;
    }

    response.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
    response.write(file, "binary");
    response.end();
  });
}

function notFound(response) {
   response.statusCode = 404;
   response.end();
}

server.listen(host.hostPort, host.hostName, () => {
  console.log(`Server running at http://${host.hostName}:${host.hostPort}/`);
});
