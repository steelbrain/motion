import { logError } from './lib/fns'

// STOP

process.on('SIGINT', cleanExit)
process.on('SIGTERM', cleanExit)
process.on('uncaughtException', cleanExit)

let child

function cleanExit(e) {
  if (e) logError(e)

  child && child.send('EXIT') // this seems to be required

  setTimeout(() => {
    child &&  child.kill('SIGINT')
    process.exit(0)
  })
}

export function stop() { cleanExit() }
export function setChild(_child) { child = _child }

export default { stop, setChild }
