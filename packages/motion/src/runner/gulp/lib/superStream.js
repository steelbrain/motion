import { Readable } from 'stream'
import File from 'vinyl'
import { gulp } from './helpers'
import { event } from '../index'
import opts from '../../opts'
import cache from '../../cache'
import bridge from '../../bridge'
import { path, log, vinyl, emitter } from '../../lib/fns'

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
    this.isBuilding = {}
    this.queue = {}
    this.stream = new Readable({ objectMode: true })
    this.stream._read = function(n) {}

    emitter.on('script:end', ({ path }) => this.doneBuilding(path))

    bridge.onMessage('live:save', this.fileSend.bind(this))

    // reset loading on errors in pipeline
    event('error', ({ path }) => this.doneBuilding(path))
  }

  getStream() {
    return this.stream
  }

  doneBuilding(path) {
    const rel = this.relPath(path)
    this.isBuilding[rel] = false
    debug('IN', 'done building', rel)
    this.runQueue(rel)
  }

  runQueue(path) {
    const queued = this.queue[path]
    if (queued) queued()
  }

  fileSend({ path, startTime, contents }) {
    const relative = this.relPath(path)
    debug('SIN', relative)

    // check if file actually in motion project
    if (!path || path.indexOf(this.basePath) !== 0 || relative.indexOf('.motion') >= 0 || !isFileType(path, 'js')) {
      debug('  file not streamable',
        path.indexOf(this.basePath) !== 0, relative.indexOf('.motion') === 0, !isFileType(path, 'js')
      )
      return
    }

    const sendImmediate = cache.isInternal(relative)

    this.pushStreamRun(relative, () => {
      debug('SOUT', relative)
      this.isBuilding[relative] = true
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
    if (!this.isBuilding[relative] || sendImmediate) {
      return finish()
    }

    this.queue[relative] = finish

    // ensure upper limit on wait
    clearTimeout(this.upperLimit)

    this.upperLimit = setTimeout(() => {
      if (!this.queue[relative])
        return

      debug('upper limit! finish'.yellow)
      this.isBuilding[relative] = false
      finish()
    }, UPPER_WAIT_LIMIT)
  }
}