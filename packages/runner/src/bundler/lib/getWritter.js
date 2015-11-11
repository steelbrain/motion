import log from '../../lib/log'
import opts from '../../opts'
import { readJSON } from './lib/fns'

export default async function getWritten() {
  try {
    const written = await readJSON(opts.get('deps').depsJSON)
    return written.deps
  }
  catch(e) {
    log('bundler', 'install: no deps installed')
    return []
  }
}