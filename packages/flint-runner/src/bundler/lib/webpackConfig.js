import deepmerge from 'deepmerge'
import path from 'path'
import opts from '../../opts'
import cache from '../../cache'

export default (config = {}) => deepmerge({
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    bluebird: '_bluebird'
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
      { test: /\.json$/, loader: 'json-loader' },
      // { test: /\.js$/, loader: 'babel-loader' }
    ]
  },
  resolveLoader: {
    root: path.join(__dirname, '..', '..', '..', '..', 'node_modules')
  },
  resolve: {
    root: opts.get('flintDir'),
    extensions: ['', '.js', '.jsx']
  }
}, config)
