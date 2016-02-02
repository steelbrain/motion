import { Readable } from 'stream'
import File from 'vinyl'
import chokidar from 'chokidar'
import { p, path, handleError, readdir, readFile, vinyl } from '../../lib/fns'
import opts from '../../opts'

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

      // push
      files.forEach(async ({ fullPath }) => {
        const source = await readFile(fullPath)
        const toStream = new File(vinyl(baseDir, fullPath, new Buffer(source)))
        stream.push(toStream)
      })
    }
    catch(e) {
      handleError(e)
    }
  })

  return stream
}

export default init