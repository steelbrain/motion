// runs server in seperate process
// trying to prevent server death when in Focus mode
// which does heavy requesting

import cp from 'child_process'
import { setChild } from './shutdown'
import opts from './opts'
import disk from './disk'

import { p } from './lib/fns'
const serverPath = p(__dirname, 'serverProcess')

export function run() {
  return new Promise((res, rej) => {
    let child = cp.fork(serverPath, '', {
      // for express to run quickly
      env: { NODE_ENV: 'production' }
    })

    setChild(child)

    child.send(JSON.stringify(opts()))

    child.once('message', message => {
      let { port, host } = JSON.parse(message)

      opts.set('port', port)
      opts.set('host', host)

      disk.writeServerState()

      res()
    })

    // send opts after first build complete
    let sendOpts = setInterval(() => {
      if (opts('hasRunInitialBuild')) {
        child.send(JSON.stringify(opts()))
        clearInterval(sendOpts)
      }
    }, 150)
  })
}

export function url() {
  const host = opts('host')
  const port = opts('port')
  return host + (port && port !== 80 ? ':' + port : '')
}

export default { run, url }
