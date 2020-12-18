const fs = require('fs');
const path = require('path');
const headers = require('./cors');
const multipart = require('./multipartUtils');

// Path for the background image ///////////////////////
module.exports.backgroundImageFile = path.join('.', 'background.jpg');
////////////////////////////////////////////////////////

let messageQueue = null;
module.exports.initialize = (queue) => {
  messageQueue = queue;
};

module.exports.router = (req, res, next = () => { }) => {
  console.log('Serving request type ' + req.method + ' for url ' + req.url);

  var respond = function (statusCode, body, extraHeaders) {
    console.log("Sending response status: " + statusCode);
    if (extraHeaders) {
      res.writeHead(statusCode, { ...headers, ...extraHeaders })
    } else {
      res.writeHead(statusCode, headers);
    }

    if (body) {
      res.write(body);
    }

    res.end();
    next();
  }

  if (req.method === 'GET') {
    if (req.url.length > 1) {
      var urlPath = req.url;
      if (urlPath[0] === '/') {
        urlPath = urlPath.slice(1);
      }

      var nonRelativePath = path.join('.', urlPath);
      if (req.url === '/background.jpg') {
        nonRelativePath = module.exports.backgroundImageFile;
      }

      fs.readFile(nonRelativePath, (err, data) => {
        if (err) {
          respond(404);
        } else {
          respond(200, data, {'Cache-Control': 'no-cache'});
        }
      });
    } else if (req.url === '/') {
      var message = messageQueue.dequeue();
      if (message) {
        respond(200, message);
      } else {
        respond(204);
      }
    }
  } else if (req.method === 'POST') {
    if (req.url === '/post-text') {
      var text = '';
      req.on('data', chunk => {
        console.log(chunk.toString());
        text += chunk;
      })
      req.on('end', () => {
        console.log(text);
        respond(200);
      });
    } else if (!req.url === '/background.jpg') {
      respond(403);
    } else {
      var buff;
      req.on('data', chunk => {
        console.log(buff);
        if (!buff) {
          buff = chunk;
          console.log(buff);
        } else {
          buff = Buffer.concat([buff, chunk]);
        }
      });
      req.on('end', () => {

        var fileData = multipart.getFile(buff).data;
        // for (var i = 3; i < buff.length; i++) {
        //   if (buff[i - 3] === 13 && buff[i - 2] === 10 && buff[i - 1] === 13 && buff[i] === 10) {
        //     buff = buff.slice(i + 1);
        //     break;
        //   }
        // }

        fs.writeFile(module.exports.backgroundImageFile, fileData, (err) => {
          if (err) {
            respond(500);
          } else {
            respond(201);
          }
        })
      });
    }
  } else {
    respond(200);
  }
};
