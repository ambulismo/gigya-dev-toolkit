'use strict';

const _ = require('lodash');

/* @ngInject */
function ValidateController($stateParams) {
  const vm = this;
  vm.sourceApiKey = $stateParams.state.sourceApiKey;
  vm.destinationApiKey = $stateParams.state.destinationApiKey;
  vm.diffs = $stateParams.params.diffs;
}

module.exports = ValidateController;