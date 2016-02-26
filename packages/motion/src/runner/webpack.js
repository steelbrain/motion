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
        console.log('onstats')
        console.log(info)
        // stats)
      },
      config: {
        context: process.cwd(),
        entry: './'+opts('config').entry,
        externals: userExternals(),
        module: {
          loaders: [
            {
              test: /\.js$/,
              loader: 'babel',
              query: config.file(_ => info = _)
            }
          ]
        }
      }
    })
  }
}

export default Webpack
