const externals = [
  'flint-js',
  'react',
  'react-dom',
  'babel-runtime',
  ''
]

export default function rmFlintExternals(ls) {
  return ls.filter(i => externals.indexOf(i) < 0)
}