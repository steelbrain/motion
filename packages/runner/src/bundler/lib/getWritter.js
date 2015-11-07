import log from '../../lib/log'
import { readJSON } from './lib/fns'

export default async function getWritten() {
  try {
    const written = await readJSON(DEPS.depsJSON)
    return written.deps
  }
  catch(e) {
    log('npm: install: no deps installed')
    return []
  }
}
