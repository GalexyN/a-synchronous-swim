const fs = require('fs');
const path = require('path');
const headers = require('./cors');
const multipart = require('./multipartUtils');

// Path for the background image ///////////////////////
module.exports.backgroundImageFile = path.join('..', 'background.jpg');
////////////////////////////////////////////////////////

let messageQueue = null;
module.exports.initialize = (queue) => {
  messageQueue = queue;
};

module.exports.router = (req, res, next = ()=>{}) => {
  console.log('Serving request type ' + req.method + ' for url ' + req.url);

  var respond = function (statusCode, body) {
    res.writeHead(statusCode, headers);
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

      fs.readFile(nonRelativePath, (err, data) => {
        if (err) {
          respond(404);
        } else {
          respond(200, data);
        }
      });
    } else if (req.url === '/') {
      var message = messageQueue.dequeue();
      if (message) {
        respond(200,message);
      } else {
        respond(204);
      }
    }
  } else {
    respond(200);
  }
};

