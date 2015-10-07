'use strict';

const gulp = require('gulp');
const _gulp = require('load-plugins')('gulp-*');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const browserify = require('browserify');
const ngAnnotate = require('browserify-ngannotate');
const watchify = require('watchify');
const babelify = require('babelify');
const stringify = require('stringify');

// Paths used in build process
const paths = {
  build: './build.browser',
  out: 'build.js'
};

function compile(watch, minify) {
  // Create browserify bundler
  const bundler = browserify('./src/gigya-dev-toolkit-browser.js', { debug: true })
    // Allow require() to include HTML files as strings
    .transform(stringify(['.html']))

    // Compile ES6 to ES5
    .transform(babelify.configure({
      optional: ['es7.classProperties']
    }))

    // Converts Angular DI shorthand into minification-safe argument style
    .transform(ngAnnotate);

  if(minify) {
    bundler.plugin('minifyify', {
      map: paths.out + '.map',
      output: paths.build + '/' + paths.out + '.map',
      compress: { // Options passed to Uglify
        drop_debugger: true,
        drop_console: true
      }
    });
  }

  function rebundle() {
    // These files are rarely updated, but not watched, restart gulp if changed:

    // Copy index.html
    gulp.src('./src/browser/index.html')
      .pipe(gulp.dest(paths.build));

    // Copy bootstrap CSS
    gulp.src('./node_modules/bootstrap/dist/**/*')
      .pipe(gulp.dest(paths.build + '/vendor/bootstrap'));


    // Bundle main files
    // Return stream so gulp knows when we've finished
    return bundler.bundle()
      // Output error if issues bundling
      .on('error', function(err) {
        _gulp.util.log(_gulp.util.colors.red(err.message));
        _gulp.util.beep();
        this.emit('end');
      })

      // Output to
      .pipe(source('build.js'))

      // Output to build dir
      .pipe(gulp.dest(paths.build));
  }

  // If watch enabled, build on update
  if(watch) {
    // Emits update when files are changed
    watchify(bundler)
      .on('update', function() {
        rebundle();
      })
      .on('log', (message) => _gulp.util.log(_gulp.util.colors.green(message)));
  }

  // Build
  return rebundle();
}

gulp.task('build', () => compile(false, false));
gulp.task('watch', () => compile(true, false));
gulp.task('build-prod', () => compile(false, true));
gulp.task('watch-prod', () => compile(true, true));
gulp.task('default', ['watch']);