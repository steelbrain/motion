var Program = require('commander')
var runner = require('../runner')
var colors = require('colors')
var fs = require('fs')

let lastArg = process.argv[process.argv.length - 1]


fs.stat(process.cwd() + '/.flint', function(err,res) {
  if (err || !res) {
    console.log()
    console.log("Run 'flint' in a flint repo to start your development server.".green.bold)
    process.argv.push('--help')
  }

  Program
    .option('-d, --debug [what]', 'output extra information for debugging')
    .option('-p, --port [number]', 'specify a port [number]')
    .option('-h, --host [host]', 'specify hostname')
    .option('--pretty', 'pretty print files')
    .option('--reset', 'resets cache, internals, bundles')
    .option('--cached', 'run from cache for speedup (may break)')
    .parse(process.argv)

  let opts = {
    version: require('../package.json').version,
    debug: Program.debug,
    port: Program.port,
    host: Program.host,
    pretty: Program.pretty,
    cached: Program.cached,
  }

  runner.run(Program)
})