import _ from 'lodash'
import rmFlintExternals from './rmFlintExternals'

 // ['pkg/x', 'pkg/y'] => ['pkg']
 // remove flint externals

export default function normalize(deps) {
  return rmFlintExternals(_.uniq(deps.map(replaceSubPath)))
}


function replaceSubPath(dep) {
  return dep.indexOf('/') ? dep.replace(/\/.*/, '') : dep
}