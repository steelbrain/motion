import { Readable } from 'stream'
import File from 'vinyl'
import { gulp } from './helpers'
import { event } from '../index'
import opts from '../../opts'
import cache from '../../cache'
import bridge from '../../bridge'
import { _, path, log, vinyl, emitter } from '../../lib/fns'

// time we wait for browser load before we just force push
const UPPER_WAIT_LIMIT = 1000
const isFileType = (_path, ext) => path.extname(_path) == `.${ext}`
const debug = log.bind(null, { name: 'stream', icon: '🎏' })

// socket for sending files to browser from editor
// has a lock system that waits before sending more

export default class SuperStream {
  constructor() {
    this.basePath = opts('appDir')
    this.relPath = p => path.relative(this.basePath, p)
    this.isBuilding = {}
    this.queue = {}
    this.stream = new Readable({ objectMode: true })
    this.stream._read = function(n) {}

    bridge.onMessage('live:save',
      _.throttle(this.fileSend.bind(this), 16, { leading: true })
    )

    emitter.on('script:end', ({ path }) => this.doneBuilding(path))
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

  runQueue(relativePath) {
    const queued = this.queue[relativePath]
    this.queue[relativePath] = false
    if (queued) queued()
  }

  fileSend({ path, startTime, contents }) {
    const relativePath = this.relPath(path)
    debug('SIN', relativePath)

    // check if file actually in motion project
    if (!path || path.indexOf(this.basePath) !== 0 || relativePath.indexOf('.motion') >= 0 || !isFileType(path, 'js')) {
      debug('  file not streamable',
        path.indexOf(this.basePath) !== 0, relativePath.indexOf('.motion') === 0, !isFileType(path, 'js')
      )
      return
    }

    const sendImmediate = cache.isInternal(relativePath)

    this.pushStreamRun(relativePath, () => {
      debug('SOUT', relativePath)
      this.isBuilding[relativePath] = true
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
    if (!this.isBuilding[relative] || sendImmediate)
      return finish()

    this.queue[relative] = finish

    // ensure upper limit on wait
    clearTimeout(this.upperLimit)
    this.upperLimit = setTimeout(() => {
      if (!this.queue[relative]) return
      debug('upper limit! finish'.yellow)
      finish()
    }, UPPER_WAIT_LIMIT)
  }
}