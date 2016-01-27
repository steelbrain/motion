const externals = [
  'flint-js',
  'react',
  'react-dom',
  'babel-runtime',
  'history',
  'radium',
  ''
]

export default function rmFlintExternals(ls) {
  return ls.filter(i => externals.indexOf(i) < 0)
}