import opts from '../../opts'
import { writeJSON, log, handleError } from '../../lib/fns'

export default async function writeFullPaths(paths) {
  try {
    log('externals', 'writeFullPaths', paths)
    const file = opts.get('deps').externalsPaths
    return await writeJSON(file, paths, { spaces: 2 })
  }
  catch(e) {
    handleError(e)
  }
}