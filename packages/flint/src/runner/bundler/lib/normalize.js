import _ from 'lodash'
import rmFlintExternals from './rmFlintExternals'

 // ['pkg/x', 'pkg/y'] => ['pkg']
 // remove flint externals

export default function normalize(deps) {
  if (!deps) return []
  return _.uniq(rmFlintExternals(deps).map(replaceSubPath)).filter(x => x !== '')
}


function replaceSubPath(dep) {
  if (typeof dep != 'string') return '' // fix bugs if they have a weird thing in there
  return dep.indexOf('/') ? dep.replace(/\/.*/, '') : dep
}