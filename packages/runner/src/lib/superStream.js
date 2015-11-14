import { Readable } from 'stream'
import File from 'vinyl'
import path from 'path'
import opts from '../opts'
import bridge from '../bridge'
import { _, log, readFile, handleError } from '../lib/fns'

let stream = new Readable({ objectMode: true })

function fileSend({ path, contents }) {
  // write to stream
  const file = vinyl(path, new Buffer(contents))
  stream.push(new File(file))
}

function init() {
  let fileSender = _.throttle(fileSend, 10, { leading: true })
  bridge.on('super:file', fileSender)
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