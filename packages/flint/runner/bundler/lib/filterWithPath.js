import normalize from './normalize'
import { _, log } from '../../lib/fns'

const LOG = 'externals'

export default function filterWithPath(imports, paths) {
  let good = _.difference(normalize(imports), normalize(paths))
  let withPath = imports.filter(i => i.indexOf(good) == 0)
  return _.uniq(withPath)
}