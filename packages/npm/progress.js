import exec from 'sb-exec'
import { p, log, handleError } from 'motion-fs-extra-plus'

// TODO: spinner -> event, opts passed in
// import { Spinner } from '../../../shared/console'
// import opts from '../../opts'

const LOG = 'externals'

export default async function progress({ label, cmd, name, index, total, options }) {
  let spinner

  try {
    spinner = logProgress(label, name, index, total)
    await exec(cmd, p(opts('modulesDir'), '..'))
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
    print(out)
  else {
    let spinner = new Spinner(out)
    spinner.start({ fps: 15 })
    return spinner
  }
}
