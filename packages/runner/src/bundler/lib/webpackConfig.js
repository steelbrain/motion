import path from 'path'
import opts from '../../opts'

let runnerDir = path.join(__dirname, '..', '..', '..', '..', 'node_modules')

export default () => ({
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    bluebird: '_bluebird',
  },
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