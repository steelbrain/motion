import regeneratorRuntime from 'regenerator-runtime-only'
global.regeneratorRuntime = regeneratorRuntime

import { run, build } from './startup'

// print - so we can easily weed out console.logs
// print = we want to log this out, keep it
global.print = console.log.bind(console)

export default { run, build }