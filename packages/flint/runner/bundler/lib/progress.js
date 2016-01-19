import execPromise from '../../lib/execPromise'
import { Spinner } from '../../lib/console'
import opts from '../../opts'
import { log, handleError } from '../../lib/fns'

const LOG = 'externals'

export default async function progress(label, cmd, name, index, total) {
  try {
    const spinner = logProgress(label, name, index, total)
    await execPromise(cmd, opts.get('flintDir'))
    spinner && spinner.stop()
  }
  catch(e) {
    if (e.code == 1)
      return handleError({ message: `NPM command ${cmd} failed` })

    handleError(e)
  }
}

function logProgress(tag, name, index, total) {
  if (!opts.get('hasRunInitialBuild')) {
    return
  }

  log('bundler', 'logProgress', tag, name)

  const out = total
    ? ` ${index+1} of ${total}: ${name}`
    : `${tag}: ${name}`

  if (opts.get('build'))
    console.log(out)
  else {
    let spinner = new Spinner(out)
    spinner.start({ fps: 15 })
    return spinner
  }
}