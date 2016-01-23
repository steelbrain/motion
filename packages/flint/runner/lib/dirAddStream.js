import { Readable } from 'stream'
import File from 'vinyl'
import chokidar from 'chokidar'
import { p, path, handleError, readdir, readFile, vinyl } from '../lib/fns'
import opts from '../opts'

// TODO copying a directory of files over is broken in gulp.watch / gulp-watch
// when a whole dir is copied in, find files and push into stream

let stream = new Readable({ objectMode: true })
stream._read = function(n) {}

function init(baseDir) {
  chokidar.watch(baseDir, {
    ignored: /[\/\\]\./,
    ignoreInitial: true
  }).on('addDir', async dir => {
    try {
      // TODO use globber from gulp
      const files = await readdir(dir, {
        fileFilter: [ '*.js' ],
        directoryFilter: [ '!.git', '!node_modules', '!.flint', '!.*' ]
      })

      const sources = await* files.map(async file => await readFile(file.fullPath))

      // sources
      sources.forEach((source, i) => {
        // put together vinyl
        const location = path.relative(baseDir, files[i].fullPath)
        const file = new File(vinyl(dir, location, new Buffer(source)))

        // push
        stream.push(file)
      })
    }
    catch(e) {
      handleError(e)
    }
  })

  return stream
}

export default init