'use strict';

/* @ngInject */
function ErrorController($stateParams) {
  const vm = this;
  vm.error = $stateParams.params.error;
}

module.exports = ErrorController;