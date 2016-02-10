import execPromise from '../../lib/execPromise'
import { Spinner } from '../../../shared/console'
import opts from '../../opts'
import { log, handleError } from '../../lib/fns'

const LOG = 'externals'

export default async function progress(label, cmd, name, index, total) {
  let spinner

  try {
    spinner = logProgress(label, name, index, total)
    await execPromise(cmd, opts('flintDir'))
    spinner && spinner.stop()
  }
  catch(e) {
    spinner && spinner.stop()
    if (e.code == 1) throw new Error(`${cmd} failed`)
  }
}

function logProgress(tag, name, index, total) {
  if (!opts('hasRunInitialBuild')) return

  log('bundler', 'logProgress', tag, name)

  const out = total
    ? `  ${index+1} of ${total}: ${name}`
    : `  ${tag}: ${name}`.dim

  if (opts('build') && !opts('watch'))
    console.log(out)
  else {
    let spinner = new Spinner(out)
    spinner.start({ fps: 15 })
    return spinner
  }
}