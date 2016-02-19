import normalize from './normalize'
import { _, log } from '../../lib/fns'

export default function filterWithPath(imports, paths) {
  let good = _.difference(normalize(imports), normalize(paths))
  let withPath = paths.filter(i => i.indexOf(good) == 0)
  // log.externals('filterWithPath', imports, paths, 'good', good, 'withPath', withPath)
  return _.uniq(withPath)
}