'use strict';

const _ = require('lodash');

/* @ngInject */
function PromptController($stateParams, $state) {
  // Questions sometimes passed as single object, not array
  const questions = _.isArray($stateParams.params.questions) ? $stateParams.params.questions : [$stateParams.params.questions];

  _.each(questions, (question) => {
    // Ensure choices are object format not shorthand string
    _.each(question.choices, (choice, i) => {
      if(!_.isObject(choice)) {
        question.choices[i] = { value: choice, name: choice };
      }
    });
  });

  const vm = this;
  vm.questions = questions;
  vm.answers = {};
  vm.submit = submit;

  //////////

  function submit() {
    // Transform Angular model into expected format
    const answers = _.cloneDeep(vm.answers);
    _.each(questions, (question, i) => {
      if(question.type === 'checkbox') {
        answers[question.name] = _.keys(answers[question.name]);
      }
    });

    const state = _.merge($stateParams.state, answers);
    $state.go('toolkit', { state });
  }
}

module.exports = PromptController;