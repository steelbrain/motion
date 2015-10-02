#!/usr/bin/env node

var Program = require('commander');
var runner = require('flint-runner');
var colors = require('colors');
var fs = require('fs');

fs.stat(process.cwd() + '/.flint', function(err, res) {
  if (err || !res) {
    console.log("\nRun 'flint' in a flint repo to start your development server.".green.bold);
    process.argv.push('--help');
  }

  Program
    .option('-w, --watch', 'incremental builds')
    .option('-v, --verbose', 'output extra information for debugging')
    .option('-i, --isomorphic', 'render template isomorphic')
    .parse(process.argv);

  runner.run(Program, true);
})
