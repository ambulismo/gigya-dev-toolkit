'use strict';

const express = require('express');
const bodyParser = require('body-parser')
const superagent = require('superagent');
const url = require('url');
const port = process.env.PORT || 5050;

// Express web server
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

// Serve index.html and associated files
app.use(express.static(__dirname + '/build.browser'));

// Proxy Gigya API requests
// This is necessary because GET requests are too small when updating settings
app.post('/proxy/:url', function(req, res) {
  // Double-encoded to prevent server errors in some environments, need to decode once more
  req.params.url = decodeURIComponent(req.params.url);

  // Validate whitelisted URL to proxy
  // Prevent attack by proxying different URL
  try {
    const parsedUrl = url.parse(req.params.url);
    if(parsedUrl.host.indexOf('.gigya.com') !== parsedUrl.host.length - '.gigya.com'.length) {
      throw parsedUrl;
    }
  } catch(e) {
    return res.status(500).send({ error: 'URL not whitelisted' });
  }

  // Fire request with params
  superagent.post(req.params.url)
    .type('form')
    .send(req.body)
    .end((error, fetched) => {
      try {
        // Check for network error
        if(error) {
          throw error;
        }

        // Parse JSON to ensure is valid
        // In the event of an attack, will prevent us from sending anything except valid JSON
        return res.send(JSON.parse(fetched.text));
      } catch(ex) {
        return res.status(500).send({ error: ex });
      }
    });
});

// Start server
app.listen(port);
console.log('Starting server on port ' + port);