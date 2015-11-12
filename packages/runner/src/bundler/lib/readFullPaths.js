import opts from '../../opts'
import { readJSON, writeJSON, log, handleError } from '../../lib/fns'

export default async function readFullPaths() {
  const file = opts.get('deps').externalsPaths

  try {
    const paths = await readJSON(file)
    log('externals', 'readFullPaths()', paths)
    return paths
  }
  catch(e) {
    handleError(e)
  }
}