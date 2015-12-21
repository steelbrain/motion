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
    .option('-v, --debug [what]', 'output extra information for debugging')
    .option('-i, --isomorphic', 'render template isomorphic')
    .option('--reset', 'resets cache, internals, bundles')
    .option('--cached', 'run from cache for speedup (may break)')
    .parse(process.argv);

  Program.version = require('../../../package.json').version

  runner.run(Program, true);
})
