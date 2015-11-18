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
let fileLoading = {}
let scriptWaiting = {}

function fileSend({ path, contents }) {
  // check if file actually in flint project
  if (path.indexOf(basePath) !== 0 || path.indexOf(flintPath) === 0) {
    log('stream', 'file not in path, or in flint dir', basePath, flintPath, path)
    return
  }

  const rPath = nodepath.relative(basePath, path)
  log('stream', rPath)

  // write to stream
  const file = new File(vinyl(rPath, new Buffer(contents)))

  function pushStream() {
    log('stream', 'pushing!')
    stream.push(file)
  }

  let attempts = 0

  // waits for file load before pushing next
  function checkPushStream() {
    log('stream', 'checkPushStream', 'rPath', rPath, 'fileLoading', fileLoading[rPath])
    // loop waiting for browser to finish loading
    if (fileLoading[rPath]) {
      // ensures it only runs once after loaded
      if (scriptWaiting[rPath]) return
      scriptWaiting[rPath] = true

      log('stream', 'checkPushStream', 'start waiting', rPath)

      // ceil attempts to avoid locks
      attempts++
      if (attempts > 50)
        fileLoading[rPath] = false

      setTimeout(checkPushStream, 5)
      return
    }

    log('stream', 'pushStream!', rPath)
    scriptWaiting[rPath] = false
    pushStream()
  }

  // internals debounce
  if (cache.isExported(path)) {
    log('stream', 'is exported')
    clearTimeout(internalTimeout)
    internalTimeout = setTimeout(pushStream, 1000)
  }
  else {
    checkPushStream()
  }
}

// ignore stream when loading file in browser
function initScriptWait() {
  let base = p => p.replace('/_/', '')

  bridge.on('file:load', ({ name }) => {
    log('stream', 'file:load TRUE', name)
    fileLoading[base(name)] = true
  })

  bridge.on('file:done', ({ name }) => {
    log('stream', 'file:load FALSE', name)
    fileLoading[base(name)] = false
  })
}

function init() {
  basePath = opts.get('appDir')
  flintPath = opts.get('flintDir')

  initScriptWait()

  // throttle the stream a bit
  let fileSender = _.throttle(fileSend, 15, { leading: true })

  bridge.on('super:file', fileSender)
}

function vinyl(path, contents) {
  const cwd = basePath
  const base = basePath + '/'
  return { cwd, base, path, contents }
}

export default { init, stream }
