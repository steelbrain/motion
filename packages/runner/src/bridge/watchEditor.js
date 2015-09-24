var fs = require('fs');
var exec = require('child_process').exec;
var chokidar = require('chokidar');

var wsMessage = require('./message');
var handleError = require('../lib/handleError');

module.exports = function watchEditor() {
  var watchOpts = {
    verbose: true,
    readDelay: 0
  };

  // watch build
  exec('whoami', handleError(watchTyping));

  function watchTyping(username) {
    var watcher = chokidar.watch('/Users/' + username.trim() + '/boom.foo', watchOpts)
    watcher.on('change', onEdit);
  }

  function onEdit(path) {
    fs.readFile(path, handleError(readEditPosition))
  }

  function readEditPosition(file) {
    var contents = file.toString().split(':');

    if (contents && contents[0] && contents[1]) {
      var line = contents[0];
      var file = contents[1];

      wsMessage('editor:location', {
        line: parseInt(line, 10),
        file: file
      });
    }
  }
}