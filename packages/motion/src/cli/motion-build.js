import './lib/checkForApp'
import Program from 'commander'
import colors from 'colors'
import Runner from '../runner'
import name from './lib/appName'
import version from './lib/version'

Program
  .option('-w, --watch', 'incremental builds')
  .option('-v, --debug [what]', 'output extra information for debugging')
  // .option('-i, --isomorphic', 'render template isomorphic')
  .option('--reset', 'resets cache, internals, bundles')
  .option('--cached', 'run from cache for speedup (may break)')
  .option('--nomin', 'avoid minification')
  .option('--out <where>', 'build target directory')
  .parse(process.argv)

const opts = {
  name,
  version,
  watch: Program.watch,
  debug: Program.debug,
  reset: Program.reset,
  cached: Program.cached,
  nomin: Program.nomin,
  out: Program.out,
  pretty: true,
}

if (opts.watch)
  Runner.run({ build: true, watch: true, ...opts })
else
  Runner.build(opts)