import { Readable } from 'stream'
import File from 'vinyl'
import nodepath from 'path'
import opts from '../opts'
import cache from '../cache'
import bridge from '../bridge'
import { _, path, log, readFile, handleError } from '../lib/fns'

const LOG = 'stream'

let basePath, flintPath
let stream = new Readable({ objectMode: true })
stream._read = function(n) {}

let internalTimeout
let fileLoading = {}
let scriptWaiting = {}

function isFileType(_path, ext) {
  return path.extname(_path) == `.${ext}`
}

function fileSend({ path, contents }) {
  log(LOG, '--- STREAM --- fileSend', path)

  // check if file actually in flint project
  if (!path || path.indexOf(basePath) !== 0 || path.indexOf(flintPath) === 0 || !isFileType(path, 'js')) {
    log(LOG, 'file no JS, not in path, or is in .flint dir', basePath, flintPath, path)
    return
  }

  // write to stream
  const rPath = nodepath.relative(basePath, path)
  const file = new File(vinyl(path, new Buffer(contents)))

  log(LOG, 'rpath', rPath)

  function pushStream() {
    log(LOG, 'pushStream()', path, rPath)
    stream.push(file)
  }

  let attempts = 0

  // waits for file load before pushing next
  function checkPushStream(loop = false) {
    if (!loop) {
      // ensures it only runs once after loaded
      if (scriptWaiting[rPath]) return
      scriptWaiting[rPath] = true
    }

    log(LOG, 'checkPushStream', 'rPath', rPath, 'fileLoading', fileLoading[rPath])
    // loop waiting for browser to finish loading
    if (fileLoading[rPath]) {
      log(LOG, 'checkPushStream', 'fileLoading = true', rPath)

      if (++attempts > 50) {
        // ceil attempts to avoid locks
        log(LOG, 'ATTEMPTS > 50!!')
        fileLoading[rPath] = false
        scriptWaiting[rPath] = false
      }
      else {
        // loop
        setTimeout(() => checkPushStream(true), 20)
        return
      }
    }

    // fileLoading[rPath] = true
    scriptWaiting[rPath] = false
    pushStream()
  }

  // internals debounce
  if (cache.isExported(path)) {
    log(LOG, 'is exported')
    clearTimeout(internalTimeout)
    internalTimeout = setTimeout(pushStream, 1000)
  }
  else {
    checkPushStream()
  }
}

// ignore stream when loading file in browser
function initScriptWait() {
  // bridge.on('script:load', ({ path }) => {
  //   log(LOG, 'script:load', path)
  //   // fileLoading[path] = true
  // })

  bridge.on('script:done', ({ path }) => {
    log(LOG, 'script:done', path)
    fileLoading[path] = false
  })
}

function init() {
  basePath = opts.get('appDir')
  flintPath = opts.get('flintDir')

  initScriptWait()

  // throttle the stream a bit
  let fileSender = _.throttle(fileSend, 22, { leading: true })

  bridge.on('live:save', fileSender)
}

function vinyl(path, contents) {
  const cwd = '/'
  const base = basePath + '/'
  return { cwd, base, path, contents }
}

export default { init, stream }
