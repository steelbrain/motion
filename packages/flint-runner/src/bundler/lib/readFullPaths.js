import opts from '../../opts'
import { readJSON, exists, log, handleError } from '../../lib/fns'

export default async function readFullPaths() {
  const pathsFile = opts.get('deps').externalsPaths

  const hasFiles = await exists(pathsFile)

  if (hasFiles)
    try {
      const paths = await readJSON(pathsFile)
      log('externals', 'readFullPaths()', paths)
      return paths
    }
    catch(e) {
      handleError(e)
    }
  else
    return []
}