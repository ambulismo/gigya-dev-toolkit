'use strict';

/* @ngInject */
function InfoController($stateParams, $state) {
  const vm = this;
  vm.message = $stateParams.params.message;
}

module.exports = InfoController;