import _ from 'lodash'
import rmExternals from './rmExternals'

 // ['pkg/x', 'pkg/y'] => ['pkg']
 // remove motion externals

export default function normalize(deps) {
  if (!deps) return []
  return _.uniq(rmExternals(deps).map(replaceSubPath))
}

function replaceSubPath(dep) {
  if (typeof dep != 'string') return '' // fix bugs if they have a weird thing in there
  return dep.indexOf('/') ? dep.replace(/\/.*/, '') : dep
}