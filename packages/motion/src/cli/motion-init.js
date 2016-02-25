import Program from 'commander'
import create from './lib/new'

Program
  .option('-n, --nocache', 'dont use local cache of latest motion scaffold')
  .option('-d, --debug', 'output extra information for debugging')
  .parse(process.argv)

create({
  init: true,
  nocache: Program.nocache,
  debug: Program.debug
})