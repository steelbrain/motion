#!/usr/bin/env node

import Program from 'commander'
import flintNew from './lib/new'

Program
  .option('-n, --nocache', 'dont use local cache of latest flint scaffold')
  .option('-d, --debug', 'output extra information for debugging')
  .option('-u, --use [scaffold]', 'start with a scaffold')
  .parse(process.argv)

const args = Program.args

if (!args.length) {
  console.log('Must give a name (flint new myname)'.red)
  process.exit(1)
}

const name = args[0]
const use = Program.use || args[1]
const nocache = Program.nocache
const debug = Program.debug

flintNew({ name, use, nocache, debug })