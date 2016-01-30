const externals = [
  'flint-js',
  // allow users to put in their own react (for stuff like react/lib/xyz or maybe override our version)
  // 'react',
  // 'react-dom',
  'babel-runtime',
  'history',
  'radium',
  ''
]

export default function rmFlintExternals(ls) {
  return ls.filter(i => externals.indexOf(i) < 0)
}