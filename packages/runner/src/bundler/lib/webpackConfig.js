import path from 'path'
import opts from '../../opts'
import cache from '../../cache'

let runnerDir = path.join(__dirname, '..', '..', '..', '..', 'node_modules')

function userExternals() {
  const imports = cache.getImports()
  const externalsObj = imports.reduce((acc, cur) => {
    acc[cur] = `Flint.packages["${cur}"]`
    return acc
  }, {})

  return externalsObj
}

export default () => ({
  externals: Object.assign(userExternals(), {
    react: 'React',
    'react-dom': 'ReactDOM',
    bluebird: '_bluebird',
  }),
  devtool: 'source-map',
  node: {
    global: false,
    Buffer: false,
    setImmediate: false
  },
  module: {
    loaders: [
      { test: /\.css$/, loaders: ['style-loader', 'css-loader'] },
      { test: /\.json$/, loader: 'json-loader' }
    ]
  },
  resolveLoader: {
    root: runnerDir
  },
  resolve: {
    root: opts.get('flintDir')
  }
})
