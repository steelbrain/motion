import Program from 'commander'
import create from './lib/new'

Program
  .option('-n, --nocache', 'dont use local cache of latest motion scaffold')
  .option('-d, --debug', 'output extra information for debugging')
  .option('-u, --use [scaffold]', 'start with a scaffold')
  .parse(process.argv)

const args = Program.args

if (!args.length) {
  console.log('\nTry giving a name "motion new amazingapp"'.green)
  process.exit(1)
}

create({
  name: args[0],
  use: Program.use || args[1],
  nocache: Program.nocache,
  debug: Program.debug
})