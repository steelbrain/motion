import { Readable } from 'stream'
import File from 'vinyl'
import nodepath from 'path'
import opts from '../opts'
import cache from '../cache'
import bridge from '../bridge'
import gulp from '../gulp'
import { _, path, log, readFile, handleError, vinyl } from '../lib/fns'

// time we wait for browser load before we just force push
const UPPER_WAIT_LIMIT = 2000

const isFileType = (_path, ext) => path.extname(_path) == `.${ext}`
const debug = log.bind(null, { name: 'stream', icon: '🚀' })

let basePath, flintPath, relPath
let internalTimeout
let browserLoading = {}
let queue = {}

function init() {
  basePath = opts('appDir')
  flintPath = opts('flintDir')
  relPath = p => nodepath.relative(basePath, p)
  watchForBrowserLoading()

  // watch, throttle the stream a bit
  bridge.on('live:save', _.throttle(fileSend, 22, { leading: true }))

  // reset loading on errors in pipeline
  gulp.event('error', ({ path }) => setBrowserLoading(relPath(path), false))
}

// ignore stream when loading file in browser
function watchForBrowserLoading() {
  bridge.on('script:load', ({ path }) => setBrowserLoading(path, true))
  bridge.on('script:done', ({ path }) => setBrowserLoading(path, false))
}

function setBrowserLoading(path, isLoading) {
  browserLoading[path] = isLoading
  debug('IN', 'browser', isLoading ? 'loading'.red : 'done'.green, path)
  if (!isLoading) loadWaiting(path)
}

let stream = new Readable({ objectMode: true })
stream._read = function(n) {}

function fileSend({ path, contents }) {
  // check if file actually in flint project
  if (!path || path.indexOf(basePath) !== 0 || path.indexOf(flintPath) === 0 || !isFileType(path, 'js')) {
    debug('  file not js || not in path || in .flint', path)
    return
  }

  // write to stream
  const relative = relPath(path)
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
    // we may get another stream in before browser even starts loading
    setBrowserLoading(relative, true)
    const file = new File(vinyl(basePath, path, new Buffer(contents)))
    stream.push(file)
  })
}

function pushStreamRun(relative, finish) {
  // waiting for script load
  if (browserLoading[relative]) {
    // only queue once
    if (queue[relative]) return
    queue[relative] = finish
    // ensure upper limit on wait
    setTimeout(() => {
      if (!queue[relative]) return
      debug('upper limit! finish'.yellow)
      browserLoading[relative] = false
      finish()
    }, UPPER_WAIT_LIMIT)
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