'use strict';

/* @ngInject */
function jsdiff() {
  return {
    restrict: 'E',
    link: link,
    scope: {
      diff: '='
    }
  };

  /* @ngInject */
  function link($scope, element, attr) {
    element.addClass('jsdiff');

    // Print visual diff
    let elPre = angular.element('<pre />');
    $scope.diff.forEach((part) => {
      // Part type determines color
      const color = part.added ? 'added' : part.removed ? 'removed' : 'unchanged';

      // Append colored text to pre
      let elSpan = angular
        .element('<span />')
        .addClass('jsdiff-' + color)
        .text(part.abbrValue ? part.abbrValue : part.value);
      elPre.append(elSpan);
    });
    element.append(elPre);
  }
}

module.exports = jsdiff;