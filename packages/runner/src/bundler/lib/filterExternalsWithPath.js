import normalize from './normalize'
import { _, log } from '../../lib/fns'

const LOG = 'externals'

export default function filterWithPath(imports, paths) {
  const good = _.difference(normalize(imports), normalize(paths))
  const withPath = imports.map(i => i.indexOf(good == 0)).filter(x => !!x)
  log(LOG, 'filterWithPath', 'good', good, 'withPath', withPath)
  return withPath
}