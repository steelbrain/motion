// import exec from '../../lib/exec'
import { Spinner } from '../../lib/console'
import opts from '../../opts'
import log from '../../lib/log'
import handleError from '../../lib/handleError'

const LOG = 'externals'

export default async function progress(label, cmd, name, index, total) {
  try {
    const spinner = logProgress(label, name, index, total)
    await execPromise(name, cmd, opts.get('flintDir'), spinner)
  }
  catch(e) {
    if (e.code == 1) {
      return handleError({
        message: `NPM command ${cmd} failed`
      })
    }

    handleError(e)
  }
}

function logProgress(tag, name, index, total) {
  if (!opts.get('hasRunInitialBuild')) {
    return
  }

  log('bundler', 'logProgress', tag, name)

  const out = total ?
    ` ${index+1} of ${total}: ${name}` :
    `${tag}: ${name}`

  if (opts.get('build'))
    console.log(out)
  else {
    console.log()
    let spinner = new Spinner(out)
    spinner.start({ fps: 30 })
    return spinner
  }
}

let { exec } = require('child_process')

function execPromise(name, cmd, dir, spinner) {
  return new Promise((res, rej) => {
    log(LOG, 'exec', cmd, dir)
    exec(cmd, { dir }, (err, stdout, stderr) => {
      if (spinner) spinner.stop()
      if (err) rej(err)
      else res(name)
    })
  })
}
