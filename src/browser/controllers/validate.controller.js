'use strict';

const _ = require('lodash');

/* @ngInject */
function ValidateController($stateParams) {
  const vm = this;
  vm.validations = $stateParams.params.validations;
}

module.exports = ValidateController;