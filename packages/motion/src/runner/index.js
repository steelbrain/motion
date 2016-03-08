import { run, build } from './startup'

// so we can easily weed out console.logs
// print = keep
// console.log = delete
global.print = console.log.bind(console)

export default { run, build }
