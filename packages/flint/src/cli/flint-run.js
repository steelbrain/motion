import './lib/checkForApp'
import Program from 'commander'
import colors from 'colors'
import fs from 'fs'
import { run } from '../runner'
import name from './lib/appName'
import version from './lib/flintVersion'

const list = v => v && v.split(',')

Program
  .option('-d, --debug [what]', 'output extra information for debugging', list)
  .option('-p, --port [number]', 'specify a port [number]')
  .option('-h, --host [host]', 'specify hostname')
  .option('--pretty', 'pretty print files')
  .option('--reset', 'resets cache, internals, bundles')
  .option('--cached', 'run from cache for speedup (may break)')
  .parse(process.argv)

run({
  name,
  version,
  debug: Program.debug,
  port: Program.port,
  host: Program.host,
  pretty: Program.pretty,
  cached: Program.cached,
})