const externals = [
  'flint-js',
  'react',
  'react-dom',
  'bluebird',
  'babel-runtime',
  ''
]

export default function rmFlintExternals(ls) {
  return ls.filter(i => externals.indexOf(i) < 0)
}