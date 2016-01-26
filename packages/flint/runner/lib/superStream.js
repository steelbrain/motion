import { Readable } from 'stream'
import File from 'vinyl'
import nodepath from 'path'
import opts from '../opts'
import cache from '../cache'
import bridge from '../bridge'
import { _, path, log, readFile, handleError, vinyl } from '../lib/fns'

const isFileType = (_path, ext) => path.extname(_path) == `.${ext}`
const debug = log.bind(null, { name: 'stream', icon: '🚀' })

let basePath, flintPath, relPath

function init() {
  basePath = opts('appDir')
  flintPath = opts('flintDir')
  relPath = p => nodepath.relative(basePath, p)
  watchForBrowserLoading()
  bridge.on('live:save',
    _.throttle(fileSend, 22, { leading: true }) // throttle the stream a bit
  )
}

// ignore stream when loading file in browser
function watchForBrowserLoading() {
  bridge.on('script:load', ({ path }) => {
    debug('IN', 'browser loading', path)
    browserLoading[path] = true
  })

  bridge.on('script:done', ({ path }) => {
    debug('IN', 'browser done', path)
    browserLoading[path] = false
    loadWaiting(path)
  })
}

let stream = new Readable({ objectMode: true })
stream._read = function(n) {}
let internalTimeout
let browserLoading = {}
let queue = {}

function fileSend({ path, contents }) {
  // check if file actually in flint project
  if (!path || path.indexOf(basePath) !== 0 || path.indexOf(flintPath) >= 0 || !isFileType(path, 'js')) {
    debug('  file not js || not in path || in .flint', path)
    return
  }

  // write to stream
  const relative = relPath(path)
  const file = new File(vinyl(basePath, path, new Buffer(contents)))
  debug('SIN', relative)

  // internals debounce // TODO watch for export finish
  if (cache.isInternal(path)) {
    debug('is exported!')
    clearTimeout(internalTimeout)
    internalTimeout = setTimeout(pushStream, 300)
    return
  }

  pushStreamRun(relative, () => {
    debug('SOUT', relative)
    queue[relative] = false
    stream.push(file)
  })
}

function pushStreamRun(relative, finish) {
  // wait for previous load
  if (browserLoading[relative]) {
    let checkTimeout
    queue[relative] = finish
    // ensure upper limit on wait
    checkTimeout = setTimeout(() => {
      if (!queue[relative]) return
      browserLoading[relative] = false
      finish()
    }, 200)
  }
  else {
    finish()
  }
}

// load waiting
function loadWaiting(path) {
  const queued = queue[relPath(path)]
  if (queued) queued()
}

export default { init, stream }