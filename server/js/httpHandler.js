const fs = require('fs');
const path = require('path');
const headers = require('./cors');
const multipart = require('./multipartUtils');

// Path for the background image ///////////////////////
module.exports.backgroundImageFile = path.join('.', 'background');
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
      var matchResult = req.url.match(/background\.(?<FileExtensions>jpg|png)/)
      if (matchResult) {
        nonRelativePath = module.exports.backgroundImageFile + '.' + matchResult.groups.FileExtensions;
      }

      fs.readFile(nonRelativePath, (err, data) => {
        if (err) {
          respond(404);
        } else {
          respond(200, data, { 'Cache-Control': 'no-cache' });
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
    if (!req.url === '/background') {
      respond(403);
    } else {
      console.log(req.headers['Content-Type'])
      var buff;
      req.on('data', chunk => {
        if (!buff) {
          buff = chunk;
        } else {
          buff = Buffer.concat([buff, chunk]);
        }
      });
      req.on('end', () => {
        var fileData = multipart.getFile(buff).data;
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
    respond(405);
  }
};
