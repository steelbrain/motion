import handleError from '../../lib/handleError'
import log from '../../lib/log'
import opts from '../../opts'
import { readJSON } from '../../lib/fns'

const LOG = 'bundler/readWritten'

export default async function readWritten() {
  try {
    const deps = opts.get('deps')
    const written = await readJSON(deps.depsJSON)
    log(LOG, written)
    return written.deps
  }
  catch(e) {
    log(LOG, 'no deps json')
    return []
  }
}