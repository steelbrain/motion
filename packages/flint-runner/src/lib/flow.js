// const addFlow = src => '/* @flow */ declare var Flint: any; declare var _require:any; ' + src

// todo: re-enable this
// .pipe(gulp.dest(TYPED_OUT_DIR))
// TYPED_OUT_DIR = p(APP_FLINT_DIR, 'typed');

// var flow = {
//   check: debounce(flowCheck, 400)
// }

// in buildScripts
// flow.check(function(passed, error) {
//   if (!passed)
//     bridge.message('compile:error', { error: error });
// })

function writeFlowFile() {
  return
  mkdirp(path.join(TYPED_OUT_DIR), function() {
    fs.writeFileSync(path.join(TYPED_OUT_DIR, '.flowconfig'), '');
  });
}

function flowCheck(cb) {
  return
  console.log("running flow check")
  var flowCmd = 'flow check --json ' + path.normalize(APP_DIR) + '/.flint/typed';
  exec(flowCmd, function() {
    if (arguments[1]) {
      //console.log(arguments);
      var response = JSON.parse(arguments[1])
      var passed = response.passed
      var toFlint = {}
      if (!passed) {
        var msg = response.errors[0].message

        toFlint = {
          message: msg
                .map(function(m) { return m.descr })
                .join(" "),
          fileName: msg[0].path,
          loc: { col: msg[0].start, line: msg[0].line}
        }
      }
      cb(response.passed, toFlint)
    }
    else {
      cb(true, null)
    }
  })
}
