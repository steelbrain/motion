#!/usr/bin/env node

var Program = require('commander');
var runner = require('flint-runner');
var colors = require('colors');
var fs = require('fs');

fs.stat(process.cwd() + '/.flint', function(err,res) {
  if (err || !res) {
    console.log();
    console.log("Run 'flint' in a flint repo to start your development server.".green.bold);
    process.argv.push('--help');
  }

  Program
    .option('-d, --debug', 'output extra information for debugging')
    .option('-p, --port [number]', 'specify a port [number]')
    .option('-h, --host [host]', 'specify hostname')
    .parse(process.argv);

  runner.run(Program);
})