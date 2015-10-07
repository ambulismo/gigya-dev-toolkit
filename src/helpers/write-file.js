'use strict';

const _ = require('lodash');
const fs = require('fs');

let browserFilesaver;
try {
  browserFilesaver = require('browser-filesaver');
} catch(e) {}

function writeFile({ filePath, data }) {
  // Write to file, return promise
  return new Promise((resolve, reject) => {
    // Stringify object data
    if(_.isObject(data) || _.isArray(data)) {
      data = JSON.stringify(data, null, 2);
    }

    if(fs && fs.writeFile) {
      // Use node FS to write
      fs.writeFile(process.cwd() + '/' + filePath, data, function(err) {
        if(err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
      browserFilesaver.saveAs(blob, filePath);
      resolve();
    }
  });
}

module.exports = writeFile;