'use strict';

// TODO: We can separate this functionality into separate files for node/browser

const fs = require('fs');
const base64url = require('base64url');

function readFile({ file }) {
  // Write to file, return promise
  return new Promise((resolve, reject) => {
    if(file.startsWith('data:')) {
      const data = base64url.decode(file.substr(file.indexOf(',')));
      resolve(data);
    } else if(fs && fs.readFile) {
      // Use node FS to read
      fs.readFile(file, function(err, data) {
        if(err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    } else {
      reject('Cannot read file');
    }
  });
}

module.exports = readFile;