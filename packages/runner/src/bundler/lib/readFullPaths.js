import opts from '../../opts'
import { readJSON, writeJSON, log, handleError } from '../../lib/fns'

export default async function readFullPaths() {
  const file = opts.get('deps').externalsPaths

  try {
    const written = await readJSON(file)
    log('externals', 'readFullPaths()', installed)
    return written
  }
  catch(e) {
    try {
      await writeJSON(file, [])
    }
    catch(e) {
      handleError(e)
    }
    finally {
      return []
    }
  }
}