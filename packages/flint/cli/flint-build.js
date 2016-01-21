import Program from 'commander'
import colors from 'colors'
import fs from 'fs'
import runner from '../runner'
import { name, version } from './info'

fs.stat(process.cwd() + '/.flint', function(err, res) {
  if (err || !res) {
    console.log("\nRun 'flint' in a flint repo to start your development server.".green.bold)
    process.argv.push('--help')
  }

  Program
    .option('-w, --watch', 'incremental builds')
    .option('-v, --debug [what]', 'output extra information for debugging')
    // .option('-i, --isomorphic', 'render template isomorphic')
    .option('--reset', 'resets cache, internals, bundles')
    .option('--cached', 'run from cache for speedup (may break)')
    .option('--nominify', 'avoid minification')
    .parse(process.argv)

  let opts = {
    name,
    version,
    watch: Program.watch,
    debug: Program.debug,
    reset: Program.reset,
    cached: Program.cached,
    nominify: Program.nominify,
    pretty: true,
  }

  runner.build(opts)
})
