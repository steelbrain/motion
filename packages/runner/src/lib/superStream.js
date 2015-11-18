import { Readable } from 'stream'
import File from 'vinyl'
import nodepath from 'path'
import opts from '../opts'
import cache from '../cache'
import bridge from '../bridge'
import { _, log, readFile, handleError } from '../lib/fns'

let basePath, flintPath
let stream = new Readable({ objectMode: true })
stream._read = function(n) {}

let internalTimeout

function fileSend({ path, contents }) {
  // check if file actually in flint project
  if (path.indexOf(basePath) !== 0 || path.indexOf(flintPath) === 0) {
    log('stream', 'file not in path, or in flint dir', basePath, flintPath, path)
    return
  }

  log('stream', path)

  // write to stream
  const file = new File(vinyl(path, new Buffer(contents)))
  const pushStream = () => {
    log('stream', 'pushing!')
    stream.push(file)
  }

  // internals debounce
  if (cache.isExported(path)) {
    log('stream', 'is exported')
    clearTimeout(internalTimeout)
    internalTimeout = setTimeout(pushStream, 1000)
  }
  else {
    pushStream()
  }
}

function init() {
  basePath = opts.get('appDir')
  flintPath = opts.get('flintDir')

  // throttle the stream a bit
  let fileSender = _.throttle(fileSend, 5, { leading: true })

  bridge.on('super:file', fileSender)
}

function vinyl(_path, contents) {
  const app = opts.get('appDir')
  const cwd = app
  const base = app + '/'
  const path = nodepath.relative(app, _path)
  return { cwd, base, path, contents }
}

export default { init, stream }