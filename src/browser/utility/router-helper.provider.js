'use strict';

/* @ngInject */
function routerHelper($locationProvider, $urlMatcherFactoryProvider, $stateProvider, $urlRouterProvider) {
  $locationProvider.html5Mode(false);
  $urlMatcherFactoryProvider.strictMode(false);

  /*jshint validthis:true */
  this.configure = function configure(cfg) {
    angular.extend(config, cfg);
  };

  this.$get = RouterHelper;
  
  /* @ngInject */
  function RouterHelper($rootScope, $state) { // If you don't get $state here, router fails silently
    var service = {
      configureStates: configureStates,
      configureTypes: configureTypes,
      when: function when(a, b) { $urlRouterProvider.when(a, b); },
      otherwise: function otherwise(a, b) { $urlRouterProvider.otherwise(a, b); }
    };

    return service;

    ///////////////

    function configureStates(states) {
      angular.forEach(states, function forEachState(state) {
        $stateProvider.state(state.state, state.config);
      });
    }

    function configureTypes(types) {
      angular.forEach(types, function(type) {
        $urlMatcherFactoryProvider.type(type.type, type.definition);
      });
    }
  }
}

module.exports = routerHelper;