

// function buildExternals() {
//   log('build externals');
//   var package = p(OPTS.dir, '.flint', 'package.json');

//   jf.readFile(package, function(err, confObj) {
//     log('package.json', err, confObj);
//     if (!err) {
//       var entries = Object.keys(confObj.dependencies).filter(function(package) {
//         return package ! == 'flintjs';
//       });

//       if (entries && entries.length) {
//         console.log('bundling externals', entries);

//         var b = browserify({
//           baseDir: p(OPTS.dir, '.flint'),
//           entries: entries,
//           debug: OPTS.debug
//         });

//         return b.bundle()
//           .pipe(gulp.dest(BUILD_DIR || OUT_DIR))
//       }
//     }
//   });
// }