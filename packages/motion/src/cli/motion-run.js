import './lib/checkForApp'
import Program from 'commander'
import colors from 'colors'
import fs from 'fs'
import Runner from '../runner'
import name from './lib/appName'
import version from './lib/version'

const list = v => v && v.split(',')

Program
  .option('-d, --debug [what]', 'output extra information for debugging', list)
  .option('-p, --port [number]', 'specify a port [number]')
  .option('-h, --host [host]', 'specify hostname')
  .option('-e, --entry [entry]', 'entry to app')
  .option('--pretty', 'pretty print files')
  .option('--reset', 'resets cache, internals, bundles')
  .option('--cached', 'run from cache for speedup (may break)')
  .parse(process.argv)

Runner.run({
  name,
  version,
  debug: Program.debug,
  port: Program.port,
  host: Program.host,
  pretty: Program.pretty,
  cached: Program.cached,
  entry: Program.entry,
})