import deepmerge from 'deepmerge'
import path from 'path'
import opts from '../../opts'
import cache from '../../cache'

// __dirname == flint-runner/dist directory (because we webpack this)
let runnerRoot = path.resolve(path.join(__dirname, '..'))
let modulesDirectories = path.join(runnerRoot, 'node_modules')

export default (config = {}) => deepmerge({
  context: runnerRoot,
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
  resolveLoader: { root: modulesDirectories },
  resolve: {
    root: [
      opts.get('flintDir'), // search for user modules in .flint
      modulesDirectories // search for babel-runtime in runner
    ],
    extensions: ['', '.js', '.jsx', '.scss']
  },
  module: {
    loaders: [
      { test: /\.css$/, loaders: ['style', 'css'] },
      {
        test: /\.(png|jpg|gif)$/,
        loader: 'url?limit=8192&name=[name]-[hash].[ext]'
      },
      {
        test: /\.scss$/,
        // Query parameters are passed to node-sass
        loader: 'style!css!resolve-url!sass?sourceMap&outputStyle=expanded&' +
            'includePaths[]=' + (path.resolve(runnerRoot, './node_modules'))
      },
      {
        test: /\.(ttf|eot|woff|svg)$/,
        loader: 'file?name=[name]-[hash].[ext]'
      },
      { test: /\.json$/, loader: 'json' },
      { test: /\.jsx$/, loader: 'babel' }
    ]
  }
}, config)
