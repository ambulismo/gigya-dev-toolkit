'use strict';

const co = require('co');
const _ = require('lodash');
const GigyaDataservice = require('./dataservices/gigya.dataservice');
const writeFile = require('./helpers/write-file');
const readFile = require('./helpers/read-file');
const jsdiff = require('diff');

const toolkit = co.wrap(function *executeInner(
  { userKey, userSecret, task, settings, partnerId, sourceFile, sourceApiKey, destinationApiKey }) {
  // Used in for() loops
  // Can be better to avoid loops that call functions to preserve use of yield
  let i;

  // Gigya credentials needed to access API
  if(!userKey || !userSecret) {
    return {
      view: 'prompt',
      params: {
        questions: [
          {
            name: 'userKey',
            type: 'input',
            message: 'GIGYA_USER_KEY',
            default: userKey
          },
          {
            name: 'userSecret',
            type: 'password',
            message: 'GIGYA_USER_SECRET_KEY',
            default: userSecret
          }
        ]
      }
    };
  }

  // In cases where user has access to many partners, will not return all partners
  // Most users have a very limited number of sites, and we want to help them
  const allPartnerSites = yield GigyaDataservice.fetchUserSites({ userKey, userSecret });

  // Get partner ID
  if(!partnerId) {
    // Only prompt for partner ID if more than one available
    // This prevents users from needing to enter their partner ID in the common use-case where they have only one account linked
    if(allPartnerSites.length === 1) {
      partnerId = partners[0].partnerID;
    } else if(allPartnerSites.length <= 10) {
      // User has less than 10 partner IDs linked
      // Choose from list
      return {
        view: 'prompt',
        params: {
          questions: {
            name: 'partnerId',
            type: 'list',
            message: 'GIGYA_PARTNER_ID',
            choices: _.pluck(allPartnerSites, 'partnerID')
          }
        }
      };
    } else {
      // User has more than 10 partner IDs
      // This usually means the user has (limited) access to more partner IDs than the API will return
      // Force manual entry
      return {
        view: 'prompt',
        params: {
          questions: {
            name: 'partnerId',
            type: 'input',
            message: 'GIGYA_PARTNER_ID'
          }
        }
      };
    }
  }

  // Fetch all partner sites (not all partners + sites)
  // This also validates the partner ID exists
  // We'll first look for it in the array of all partners + sites we already have to save some time
  let partnerSites;
  let findPartner = _.findWhere(allPartnerSites, { partnerID: partnerId });
  if(findPartner) {
    partnerSites = [findPartner];
  } else {
    partnerSites = yield GigyaDataservice.fetchUserSites({ userKey, userSecret, partnerId });
  }

  // Used to list sites on partner
  const sites = [];
  _.each(partnerSites[0].sites, (site) => {
    // If the site breaks onto a second line it breaks my console, keep line length sane
    sites.push({
      name: `${site.apiKey} (${site.baseDomain}${site.description ? ', ' + site.description : ''})`,
      value: site.apiKey
    });
  });
  
  if(!task) {
    return {
      view: 'prompt',
      params: {
        questions: {
          name: 'task',
          type: 'list',
          message: 'TASK',
          choices: [
            { name: 'EXPORT', value: 'export' },
            { name: 'IMPORT', value: 'import' },
            { name: 'COPY', value: 'copy' },
            { name: 'VALIDATE', value: 'validate' }
          ]
        }
      }
    };
  }

  if(!settings) {
    return {
      view: 'prompt',
      params: {
        questions: {
          type: task !== 'import' ? 'checkbox' : 'list', // TODO: Import multiple settings at a time
          name: 'settings',
          message: task !== 'import' ? 'SETTINGS' : 'SETTING',
          choices: [
            { name: 'SCHEMA', value: 'schema' },
            { name: 'SCREENSETS', value: 'screensets' },
            { name: 'POLICIES', value: 'policies' }
          ]
        }
      }
    };
  }

  // Looks at current setting and calls something like fetchSchema
  // operation = fetch or update
  function *crud(operation, setting, params = {}) {
    var method = `${operation}${setting.charAt(0).toUpperCase()}${setting.slice(1)}`;
    return yield GigyaDataservice[method](_.merge({ userKey, userSecret }, params));
  }

  switch(task) {
    case 'export':
      // Get API key to export from
      if(!sourceApiKey) {
        return {
          view: 'prompt',
          params: {
            questions: {
              name: 'sourceApiKey',
              type: 'list',
              message: 'SOURCE_GIGYA_SITE',
              choices: sites
            }
          }
        };
      }

      // Get data to write to file
      for(i = 0; i < settings.length; i++) {
        writeFile({
          filePath: `${settings[i]}.${sourceApiKey}.${new Date().getTime()}.json`,
          data: yield crud('fetch', settings[i], { apiKey: sourceApiKey })
        });
      }

      // Show success message
      return {
        view: 'info',
        params: {
          message: `EXPORT_SUCCESSFUL`
        }
      };
      break;

    case 'import':
      // Get file which we will load settings from
      if(!sourceFile) {
        return {
          view: 'prompt',
          params: {
            questions: {
              name: 'sourceFile',
              type: 'file',
              message: 'LOAD_FILE'
            }
          }
        };
      }

      // Get API key to import to
      if(!destinationApiKey) {
        return {
          view: 'prompt',
          params: {
            questions: {
              name: 'destinationApiKey',
              type: 'list',
              message: 'DESTINATION_GIGYA_SITE',
              choices: sites
            }
          }
        };
      }

      // Fetch data from file, parse into JSON, and pass parameter into crud method
      // Parameter is either "schema", "screensets", or "policies"
      yield crud('update', settings, {
        apiKey: destinationApiKey,
        [settings]: JSON.parse(yield readFile({ file: sourceFile }))
      });

      // Show success message
      return {
        view: 'info',
        params: {
          message: `IMPORT_SUCCESSFUL`
        }
      };
      break;

    case 'copy':
      // Get API keys to copy from/to
      if(!sourceApiKey) {
        return {
          view: 'prompt',
          params: {
            questions: {
              name: 'sourceApiKey',
              type: 'list',
              message: 'SOURCE_GIGYA_SITE',
              choices: sites
            }
          }
        };
      }
      if(!destinationApiKey) {
        return {
          view: 'prompt',
          params: {
            questions: {
              name: 'destinationApiKey',
              type: 'list',
              message: 'DESTINATION_GIGYA_SITE',
              choices: sites
            }
          }
        };
      }

      // Push settings from source into destination
      // We can't roll back, hope for the best!
      // Could limit to single attribute to copy at a time...
      for(i = 0; i < settings.length; i++) {
        yield crud('update', settings[i], {
          apiKey: destinationApiKey,
          [settings[i]]: yield crud('fetch', settings[i], { apiKey: sourceApiKey })
        });
      }

      // Show success message
      return {
        view: 'info',
        params: {
          message: `COPY_SUCCESSFUL`
        }
      };
      break;

    case 'validate':
      if(!sourceApiKey && !sourceFile) {
        return {
          view: 'prompt',
          params: {
            questions: {
              name: 'sourceApiKey',
              type: 'list',
              message: 'SOURCE_GIGYA_SITE',
              choices: sites
            }
          }
        };
      }

      if(!destinationApiKey) {
        return {
          view: 'prompt',
          params: {
            questions: {
              name: 'destinationApiKey',
              type: 'list',
              message: 'DESTINATION_GIGYA_SITE',
              choices: sites
            }
          }
        };
      }

      const diffs = [];
      let diff;
      let sourceObj;
      let destinationObj;
      let numAdded;
      let numRemoved;
      let numChanged;
      let isDifferent;
      for(i = 0; i < settings.length; i++) {
        // Fetch objects and run jsdiff
        sourceObj = yield crud('fetch', settings[i], { apiKey: sourceApiKey });
        destinationObj = yield crud('fetch', settings[i], { apiKey: destinationApiKey });
        diff = jsdiff.diffJson(sourceObj, destinationObj);

        // Calculate stats
        numAdded = 0;
        numRemoved = 0;
        diff.forEach((part) => {
          if(part.added) {
            numAdded += part.count;
          } else if(part.removed) {
            numRemoved += part.count;
          }
        });
        numChanged = Math.min(numAdded, numRemoved);
        numRemoved -= numChanged;
        numAdded -= numChanged;
        isDifferent = numAdded || numRemoved || numChanged;

        // Abbreviate diff value if necessary, retains original value, creats new abbrValue index
        // Standardize newlines
        diff.forEach((part) => {
          let i;

          // Trim newlines at ends so we can ENSURE they exist consistently
          part.value = part.value.replace(/^[\r\n]+|[\r\n]+$/g, '') + "\n";

          // Abbr length varies, show less of unchanged text
          const diffLength = part.added || part.removed ? 1000 : 300;
          const halfDiffLength = (diffLength / 2);

          // We don't want to show the entire value
          // Limit to X chars -> find next newline -> if newline doesn't exist in X additional chars chop off
          if(part.value.length > diffLength) {
            // Halve diff
            let valueFirstHalf = part.value.substr(0, halfDiffLength);
            let valueLastHalf = part.value.substr(part.value.length - halfDiffLength);

            // Look for newline breakpoints
            valueFirstHalf = valueFirstHalf.substr(0, valueFirstHalf.lastIndexOf("\n"));
            valueLastHalf = valueLastHalf.substr(valueLastHalf.indexOf("\n"));

            // Write back to diff
            // Trim newlines at ends so we can ENSURE they exist consistently
            part.abbrValue = valueFirstHalf.replace(/^[\r\n]+|[\r\n]+$/g, '')
              + "\r\n...\r\n"
              + valueLastHalf.replace(/^[\r\n]+|[\r\n]+$/g, '')
              + "\r\n";
          }
        });
  
        // This is what we're returning
        diffs.push({
          setting: settings[i],
          diff,
          sourceObj,
          destinationObj,
          isDifferent,
          numAdded,
          numRemoved,
          numChanged
        });
      }

      return {
        view: 'validate',
        params: { diffs }
      }
      break;
  }
});

module.exports = toolkit;