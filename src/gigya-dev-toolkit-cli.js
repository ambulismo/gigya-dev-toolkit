'use strict';

const state = require('commander');
const _ = require('lodash');
const colors = require('colors');
const co = require('co');
const inquirer = require('inquirer');
const toolkit = require('./gigya-dev-toolkit.js');
const t = require('./translations/en.json');
const fs = require('fs');

// Command-line arguments
state
  .option('--userKey [value]', t.GIGYA_USER_KEY)
  .option('--userSecret [value]', t.GIGYA_USER_SECRET_KEY)
  .option('--task [value]', t.TASK)
  .option('--settings [value]', t.SETTINGS)
  .option('--partnerId [value]', t.GIGYA_PARTNER_ID)
  .option('--sourceApiKey [value]', t.SOURCE_GIGYA_SITE)
  .option('--sourceFile [value]', t.SETTINGS_FILE)
  .option('--destinationApiKeys [value]', t.DESTINATION_GIGYA_SITES)
  .parse(process.argv);

// Convert strings to arrays when necessary
if(_.isString(state.settings) && state.task !== 'import') {
  state.settings = state.settings.split(',');
}
if(_.isString(state.destinationApiKeys)) {
  state.destinationApiKeys = state.destinationApiKeys.split(',');
}

function prompt({ questions }) {
  // Ensure array is passed, even for only 1 question
  if(!_.isArray(questions)) {
    questions = [questions];
  }

  // Mild transformation
  _.each(questions, (question) => {
    // For type = "file", we want to list only files in the current working directory
    if(question.type === 'file') {
      question.type = 'list';

      // Get list of files in current working directory
      question.choices = fs.readdirSync(process.cwd());

      // Only list .json files
      question.choices = _.filter(question.choices, (file) => file.endsWith('.json'));
    }

    // Localize
    if(t[question.message]) {
      question.message = t[question.message];
    }
    if(t[question.default]) {
      question.default = t[question.default];
    }

    // Typecast all choices as string (crashes otherwise)
    if(question.choices) {
      _.each(question.choices, (value, key) => {
        // Convert shorthand string to object format
        if(!_.isObject(value)) {
          question.choices[key] = value = { name: value, value };
        }

        // Choice can be { name, value }
        // Typecast only name, which must be string
        if(!_.isString(value.name)) {
          value.name = value.name + '';
        }

        // Localize if necessary
        if(t[value.name]) {
          value.name = t[value.name];
        }

        // Command line bugs out if the value name > console width
        if(value.name.length > 83) {
          value.name = `${value.name.substr(0, 80)}...`;
        }
      });
    }
  });

  // Wrap in promise for yield
  return new Promise((resolve, reject) => {
    inquirer.prompt(questions, (res) => {
      _.each(questions, (question) => {
        // We don't use defaults to populate values
        // The HTML version represents it as a "placeholder" attribute, to give you an idea
        if(question.default && res[question.name] === question.default) {
          res[question.name] = undefined;

        // All empty values should be undefined
        } else if(res[question.name] === ''
          || (_.isArray(res[question.name]) && res[question.name].length === 0)) {
          res[question.name] = undefined;
        }
      });

      _.merge(state, res);
      resolve();
    });
  });
}

function validate({ validations }) {
  _.each(validations, ({ diffs, site }) => {
    console.log(`${site.baseDomain}`.bold.underline);
    console.log(`${site.description}`);
    console.log(`${site.apiKey}`);
    console.log('');

    _.each(diffs, ({ setting, diff, sourceObj ,destinationObj, isDifferent, numAdded, numRemoved, numChanged }) => {
      console.log(`${t[setting.toUpperCase()]}:`.bold.underline);
      if(!isDifferent) {
        console.log(t.VALIDATION_PASSED.green);
      } else {
        if(numChanged) {
          console.log(`${t.CHANGED} ${numChanged} ${numChanged > 1 ? t.VALUES : t.VALUE}`.bold.yellow);
        }
        if(numRemoved) {
          console.log(`${t.REMOVED} ${numRemoved} ${numRemoved > 1 ? t.VALUES : t.VALUE}`.bold.red);
        }
        if(numAdded) {
          console.log(`${t.ADDED} ${numAdded} ${numAdded > 1 ? t.VALUES : t.VALUE}`.bold.green);
        }
        console.log('');

        // Print visual diff
        diff.forEach((part) => {
          // Part type determines color
          const color = part.added ? 'green' : part.removed ? 'red' : 'grey';

          // Append text to pre
          process.stderr.write((part.abbrValue ? part.abbrValue : part.value)[color]);
        });
      }

      console.log('');
      console.log('');
    });
  });

  state.finished = true;
}

function info({ message }) {
  console.log('');
  console.log(t[message].bold);
  state.finished = true;
}

function main() {
  if(!state.finished) {
    toolkit(state).then((res) => {
      co(function*() { // Allow use of yield
        switch(res.view) {
          case 'prompt':
            yield prompt(res.params);
            break;

          case 'info':
            info(res.params);
            break;

          case 'validate':
            validate(res.params);
            break;
        }

        main();
      });
    }, (err) => {
      if(err.message) {
        // User-friendly message, probably an expected error
        console.error(err.message.white.bgRed);
      } else {
        // Unexpected error
        console.error(t.UNRECOVERABLE_ERROR.white.bgRed);
        if(err.stack) {
          console.error(err.stack);
        } else {
          console.error(err);
        }
      }
    });
  } else { // finished
    // Provide easy way to run this command again:
    let consoleCommand = 'gigya-dev-toolkit';

    // Loop through each possible command
    _.each(state.options, (opt) => {
      // If value for command exists in state
      if(state[opt.long.substr(2)]) {
        // Get value for this command
        let value = state[opt.long.substr(2)];

        // Convert arrays to strings
        if(_.isArray(value)) {
          value = value.join(',');
        }

        // Add command value to output
        consoleCommand += ` ${opt.long} "${value}"`;
      }
    });

    // Print full command
    console.log('');
    console.log(`${t.TO_RUN_THIS_COMMAND_AGAIN}:`.dim);
    console.log(consoleCommand.dim);
  }
}
main();