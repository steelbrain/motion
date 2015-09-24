module.exports = function(dir, name, cb) {
  // npm install
  console.log('installing package', name)

  exec('npm install --save ' + name, dir, function() {
    console.log('installed', name)
    cb();
  })
}

function exec(cmd, dir, cb) {
  var childExec = require('child_process').exec;
  childExec(cmd, {
    uid: process.getuid(),
    cwd: dir
  }, cb);
}
