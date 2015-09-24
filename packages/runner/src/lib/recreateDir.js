var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var handleError = require('./handleError');

module.exports = function(dir, cb) {
  rimraf(dir, createDir);

  function createDir() {
    mkdirp(dir, cb || function() {});
  }

  return dir;
}
