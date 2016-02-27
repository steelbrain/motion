import opts from './opts'
import webpack from './bundler/webpack'
import { userExternals } from './bundler/externals'
import config from './gulp/lib/config'

class Webpack {
  constructor() {
    let info

    webpack({
      name: 'app',
      onFinish: stats => {
        // TODO send this over to gulp watchers
        console.log(info, stats)
      },
      config: {
        context: process.cwd(),
        entry: './'+opts('config').entry,
        externals: userExternals(),
        babel: config.file(_ => info = _),
        module: {
          loaders: [
            {
              test: /\.js$/,
              loader: 'babel',
            }
          ]
        }
      }
    })
  }
}

export default Webpack
