import through from 'through2'
import File from 'vinyl'
import path from 'path'
import opts from '../opts'
import bridge from '../bridge'
import { log, readFile, handleError } from '../lib/fns'

// const stream = through.obj().pipe(through.obj(createFile))

import { Readable } from 'stream'
let stream = new Readable({ objectMode: true })

function init() {
  bridge.on('super:file', ({ path, contents, timestamp }) => {
    // write to stream
    const file = vinyl(path, new Buffer(contents))
    stream.push(new File(file))
  })
}

stream._read = function(n) {}

function createFile(globFile, enc, cb) {
  console.log('got', globFile)
  cb(null, new File(globFile));
}

function vinyl(_path, contents) {
  return { cwd: opts.get('appDir'), base: opts.get('appDir') + '/', path: path.basename(_path), contents }
}

export default { init, stream }