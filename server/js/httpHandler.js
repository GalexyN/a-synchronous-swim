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

module.exports.router = (req, res, next = ()=>{}) => {
  console.log('Serving request type ' + req.method + ' for url ' + req.url);


  if (req.method === 'GET') {
    var message = messageQueue.dequeue();
    if (message) {
      res.writeHead(200, headers);
      res.write(message);
    } else {
      res.writeHead(204, headers);
    }
  } else {
    res.writeHead(200, headers);
  }

  res.end();
  next(); // invoke next() at the end of a request to help with testing!
};
