import opts from './opts'
import Cache from './cache'
import webpack from './bundler/webpack'
import { userExternals } from './bundler/externals'
import { _, path, handleError } from './lib/fns'
import config from './gulp/lib/config'

class Webpack {
  async bundleApp() {
    return await this.pack()
  }

  pack() {
    return new Promise(async (res, rej) => {
      try {
        let files = []
        let allInfo = []

        await webpack({
          name: 'app',
          onFinish: stats => {
            files = stats.modules.map(file => file.name).filter(name => name.indexOf('./') == 0)
          },
          // TODO on error
          config: {
            context: process.cwd(),
            entry: './'+opts('config').entry,
            externals: userExternals(),
            babel: config.file(fileInfo => {
              allInfo.push(fileInfo)
            }),
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

        let info = _.flatten(files.map(file => allInfo.filter(i => './' + i.name == file)))

        res({ files, info })
      }
      catch(e) {
        rej(e)
      }
    })
  }
}

export default Webpack
