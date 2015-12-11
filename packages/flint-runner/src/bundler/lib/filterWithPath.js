import normalize from './normalize'
import { _, log } from '../../lib/fns'

const LOG = 'externals'

export default function filterWithPath(imports, paths) {
  log(LOG, 'filterWithPath', 'imports', imports, 'paths', paths)  
  const good = _.difference(normalize(imports), normalize(paths))
  const withPath = imports.filter(i => i.indexOf(good) == 0)
  log(LOG, 'filterWithPath', 'good', good, 'withPath', withPath)
  return withPath
}