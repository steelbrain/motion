import opts from '../../opts'
import { writeJSON, log, handleError } from '../../lib/fns'

export default async function writeFullPaths(paths) {
  try {
    const file = opts.get('deps').externalsPaths
    return await writeJSON(file, paths)
  }
  catch(e) {
    handleError(e)
  }
}