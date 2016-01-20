import regeneratorRuntime from 'regenerator-runtime-only'
global.regeneratorRuntime = regeneratorRuntime

import { run, build } from './startup'

export default { run, build }