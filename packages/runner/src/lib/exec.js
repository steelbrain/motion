export default function exec(cmd, dir, cb) {
  var childExec = require('child_process').exec;
  childExec(cmd, {
    uid: process.getuid(),
    cwd: dir
  }, cb);
}
