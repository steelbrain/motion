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
    this.upperLimit = {}
    this.queue = {}
    this.stream = new Readable({ objectMode: true })
    this.stream._read = function(n) {}

    // start receiving saves for stream
    bridge.onDidReceiveMessage('live:save',
      _.throttle(this.fileSend.bind(this), 16, { leading: true })
    )

    // clear stream at times
    emitter.on('script:end', ({ path }) => this.doneBuilding(path))
    event('error', ({ path }) => this.doneBuilding(path))

    // clear all stream on packages bundle (TODO make this smarter)
    bridge.onDidReceiveMessage('packages:reload', () => {
      this.isBuilding = {}
    })
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

  // prevent upper limit send post hoc
  avoidSending(path) {
    const rel = this.relPath(path)
    this.queue[rel] = false
    clearTimeout(this.upperLimit[rel])
  }

  runQueue(rel) {
    const queued = this.queue[rel]
    this.queue[rel] = false
    if (queued) queued()
  }

  fileSend({ path, startTime, contents }) {
    const rel = this.relPath(path)
    debug('SIN', rel)

    // check if file actually in motion project
    if (!path || path.indexOf(this.basePath) !== 0 || rel.indexOf('.motion') >= 0 || !isFileType(path, 'js')) {
      debug('  file not streamable',
        path.indexOf(this.basePath) !== 0, rel.indexOf('.motion') === 0, !isFileType(path, 'js')
      )
      return
    }

    const sendImmediate = (
      cache.isInternal(rel) ||
      cache.isInstalling(rel)
    )

    this.pushStreamRun(rel, () => {
      debug('SOUT', rel)
      this.isBuilding[rel] = true
      const file = new File(vinyl(this.basePath, path, new Buffer(contents)))

      const stackTime = [{
        name: 'fileSend',
        time: +(Date.now()) - startTime
      }]

      Object.assign(file, { startTime, stackTime })

      this.stream.push(file)
    }, sendImmediate)
  }

  pushStreamRun(rel, finish, sendImmediate) {
    if (!this.isBuilding[rel] || sendImmediate)
      return finish()

    this.queue[rel] = finish

    // ensure upper limit on wait
    clearTimeout(this.upperLimit[rel])
    this.upperLimit[rel] = setTimeout(() => {
      if (!this.queue[rel]) return
      debug('upper limit! finish'.yellow)
      finish()
    }, UPPER_WAIT_LIMIT)
  }
}
