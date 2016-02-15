import { Readable } from 'stream'
import File from 'vinyl'
import { gulp } from './helpers'
import { event } from '../index'
import opts from '../../opts'
import cache from '../../cache'
import bridge from '../../bridge'
import { _, path, log, readFile, handleError, vinyl, emitter } from '../../lib/fns'

// time we wait for browser load before we just force push
const UPPER_WAIT_LIMIT = 1000
const isFileType = (_path, ext) => path.extname(_path) == `.${ext}`
const debug = log.bind(null, { name: 'stream', icon: '🎏' })

// socket for sending files to browser from editor
// has a lock system that waits before sending more

export default class SuperStream {
  constructor() {
    this.basePath = opts('appDir')
    this.motionPath = opts('motionDir')
    this.relPath = p => path.relative(this.basePath, p)
    this.internalTimeout
    this.isBuilding = {}
    this.queue = {}
    this.stream = new Readable({ objectMode: true })
    this.stream._read = function(n) {}

    emitter.on('script:start', ({ path }) => this.setBuilding(path, true))
    emitter.on('script:end', ({ path }) => this.setBuilding(path, false))

    // watch, throttle the stream a bit
    // bridge.onMessage('live:save', _.throttle(this.fileSend.bind(this), 22, { leading: true }))
    bridge.onMessage('live:save', this.fileSend.bind(this))

    // reset loading on errors in pipeline
    event('error', ({ path }) => this.setBuilding(this.relPath(path), false))
  }

  getStream() {
    return this.stream
  }

  setBuilding(path, isBuilding) {
    this.isBuilding[path] = isBuilding
    debug('IN', 'isBuilding', isBuilding, path)
    if (!isBuilding) this.waiting(path)
  }

  waiting(path) {
    const queued = this.queue[this.relPath(path)]
    if (queued) queued()
  }

  fileSend({ path, startTime, contents }) {
    const relative = this.relPath(path)

    // check if file actually in motion project
    if (!path || path.indexOf(this.basePath) !== 0 || relative.indexOf('.motion') >= 0 || !isFileType(path, 'js')) {
      debug('  file not streamable',
        path.indexOf(this.basePath) !== 0, relative.indexOf('.motion') === 0, !isFileType(path, 'js')
      )
      return
    }

    // write to stream

    const sendImmediate = cache.isInternal(path)

    debug('SIN', relative)

    this.pushStreamRun(relative, () => {
      debug('SOUT', relative)
      this.queue[relative] = false
      const file = new File(vinyl(this.basePath, path, new Buffer(contents)))

      const stackTime = [{
        name: 'fileSend',
        time: +(Date.now()) - startTime
      }]

      Object.assign(file, { startTime, stackTime })

      this.stream.push(file)

    }, sendImmediate)
  }

  pushStreamRun(relative, finish, sendImmediate) {
    // waiting for script load
    if (!this.isBuilding[relative] || sendImmediate)
      return finish()

    // only queue once
    if (this.queue[relative])
      return

    this.queue[relative] = finish

    // ensure upper limit on wait
    setTimeout(() => {
      if (!this.queue[relative])
        return

      debug('upper limit! finish'.yellow)
      this.isBuilding[relative] = false
      finish()
    }, UPPER_WAIT_LIMIT)
  }
}