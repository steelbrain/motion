import handleError from '../../lib/handleError'
import log from '../../lib/log'
import opts from '../../opts'
import { readJSON } from '../../lib/fns'

export default async function readWritten() {
  try {
    const deps = opts.get('deps')
    const written = await readJSON(deps.depsJSON)
    return written.deps
  }
  catch(e) {
    return []
  }
}