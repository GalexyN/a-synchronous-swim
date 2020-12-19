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

  var dataHandler = buff => chunk => {
    console.log(`Buff: ${buff}`);
    if (!buff.buff) {
      buff.buff = chunk;
    } else {
      buff.buff = Buffer.concat([buff.buff, chunk]);
    }
  };

  if (req.method === 'GET') {
    if (req.url === '/background') {

      var readStreamJPG = fs.createReadStream(module.exports.backgroundImageFile + '.jpg')
      var readStreamPNG = fs.createReadStream(module.exports.backgroundImageFile + '.png')

      var JPGflag = false;
      var PNGflag = false;

      var buff = {};

      readStreamJPG.on('error', (err) => {
        if (err) {
          JPGflag = true;
        }
        if (JPGflag && PNGflag) {
          respond(404)
        }
      });

      readStreamJPG.on('data', dataHandler(buff));

      readStreamJPG.on('end', () => {
        respond(200, buff.buff, { 'Cache-Control': 'no-store' });
      });

      readStreamPNG.on('error', (err) => {
        if (err) {
          PNGflag = true;
        }
        if (JPGflag && PNGflag) {
          respond(404)
        }
      });

      readStreamPNG.on('data', dataHandler(buff));

      readStreamPNG.on('end', () => {
        respond(200, buff.buff, { 'Cache-Control': 'no-store' });
      });

    } else if (req.url.length > 1) {
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
          respond(404, null, { 'Cache-Control': 'no-store' });
        } else {
          respond(200, data, { 'Cache-Control': 'no-store' });
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
      var contentType = req.headers['content-type'];

      var writeFile = module.exports.backgroundImageFile;
      var removeFile = module.exports.backgroundImageFile;

      if (contentType === 'image/jpeg') {
        writeFile += '.jpg';
        removeFile += '.png';
      } else if (contentType === 'image/png') {
        writeFile += '.png';
        removeFile += '.jpg';
      }

      var buff = {};
      req.on('data', dataHandler(buff));
      req.on('end', () => {
        var fileData = multipart.getFile(buff.buff).data;

        var writeStream = fs.createWriteStream(writeFile);

        writeStream.on('error', err => {
          respond(500);
        })

        writeStream.write(fileData, () => {
          fs.unlink(removeFile, err => {
            if (err) {
              if (err.code === 'ENOENT') {
                respond(201);
              }
              respond(500);
            } else {
              respond(201);
            }
          });
        });
      });
    }
  } else if (req.method === 'OPTIONS') {
    respond(200);
  } else {
    respond(405);
  }
};
