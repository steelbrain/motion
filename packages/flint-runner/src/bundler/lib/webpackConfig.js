import deepmerge from 'deepmerge'
import path from 'path'
import opts from '../../opts'
import cache from '../../cache'

console.log('dirname', path.relative('/', __dirname))

let context = path.join(__dirname, '..', '..', '..', '..')
let modulesDirectories = path.join(context, 'node_modules')

console.log('context', path.relative('/', context))

export default (config = {}) => deepmerge({
  context,
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
  resolveLoader: { root: modulesDirectories },
  resolve: {
    root: opts.get('flintDir'),
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [
      { test: /\.css$/, loaders: ['style', 'css'] },
      {
        test: /\.(png|jpg|gif)$/,
        loader: 'url-loader?limit=8192&name=[name]-[hash].[ext]'
      },
      {
        test: /\.scss$/,
        // Query parameters are passed to node-sass
        loader: 'style!css!resolve-url!sass?sourceMap&outputStyle=expanded&' +
            'includePaths[]=' + (path.resolve(context, './node_modules'))
      },
      {
        test: /\.(ttf|eot|woff|svg)$/,
        loader: 'file?name=[name]-[hash].[ext]'
      },
      { test: /\.json$/, loader: 'json' },
      { test: /\.jsx?$/, loader: 'babel' }
    ]
  }
}, config)
