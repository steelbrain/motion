const externals = [ 'flint-js', 'react', 'react-dom', 'bluebird' ]
const rmFlintExternals = ls => ls.filter(i => externals.indexOf(i) < 0)

 // ['pkg/x', 'pkg/y'] => ['pkg'] and remove flint externals
export const normalize = deps =>
  rmFlintExternals(_.uniq(deps.map(dep => dep.indexOf('/') ? dep.replace(/\/.*/, '') : dep)))
