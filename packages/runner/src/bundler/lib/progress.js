import exec from '../../lib/exec'
import { Spinner } from '../../lib/console'
import opts from '../../opts'
import log from '../../lib/log'
import handleError from '../../lib/handleError'

export default async function progress(label, cmd, name, index, total) {
  try {
    const spinner = logProgress(label, name, index, total)
    await execPromise(name, cmd, opts.get('flintDir'), spinner)
  }
  catch(e) {
    handleError(e)
  }
}

function logProgress(tag, name, index, total) {
  if (!opts.get('hasRunInitialBuild')) {
    return
  }

  log('npm', tag, name)

  const out = total ?
    ` ${index+1} of ${total}: ${name}` :
    `${tag}: ${name}`

  if (OPTS.build)
    console.log(out)
  else {
    console.log()
    let spinner = new Spinner(out)
    spinner.start({ fps: 30 })
    return spinner
  }
}

function execPromise(name, cmd, dir, spinner) {
  return new Promise((res, rej) => {
    exec(cmd, dir, (err, stdout, stderr) => {
      if (spinner) spinner.stop()
      if (err) rej(err)
      else res(name)
    })
  })
}
