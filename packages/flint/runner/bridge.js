'use babel'

import {Emitter, CompositeDisposable} from 'sb-event-kit'
import {createServer} from 'ws'
import websocketPort from './lib/wport'
import Cache from './cache'
import getOptions from './opts'
import Log from './lib/log'

const debug = Log.bind(null, { name: 'bridge', icon: '🚃' })

export default new class Bridge {
  constructor() {
    this.subscriptions = new CompositeDisposable()
    this.emitter = new Emitter()
    this.connections = new Set()
    this.server = null
    this.queue = []

    this.subscriptions.add(this.emitter)
  }
  activate() {
    this.server = createServer({
      port: websocketPort()
    }, connection => {
      this.connections.add(connection)
      connection.on('close', () => {
        this.connections.delete(connection)
      })
      connection.on('message', (data, flags) => {
        if (flags.binary) {
          // Ignore binary
          debug('Ignoring message because its binary')
          return
        }
        try {
          const message = JSON.parse(data)
          debug('IN', message._type)
          this.emitter.emit(`message:${message._type}`, message)
        } catch (_) {
          debug('Error parsing bridge message')
        }
      })
      this.welcomeConnection(connection)
    })
  }
  welcomeConnection(connection) {
    connection.send(this.encodeMessage('flint:baseDir', {
      dir: Cache.baseDir()
    }))
    connection.send(this.encodeMessage('flint:opts', getOptions()))
    if (this.queue.length) {
      this.queue.forEach(function(contents) {
        connection.send(contents)
      })
      this.queue = []
    }
  }
  broadcast(type, message) {
    this.broadcastRaw(this.encodeMessage(type, message))
  }
  encodeMessage(type, message = {}) {
    debug('OUT', type)
    return JSON.stringify(Object.assign({
      _type: type,
      timestamp: Date.now()
    }, message))
  }
  broadcastRaw(message) {
    if (typeof message !== 'string') {
      throw new Error('Malformed message given')
    }

    if (this.connections.size) {
      this.connections.forEach(function(connection) {
        connection.send(message)
      })
    } else this.queue.push(message)
  }
  onMessage(type, callback) {
    return this.emitter.on(`message:${type}`, callback)
  }
  dispose() {
    if (this.server) {
      this.server.close()
    }
    this.connections.clear()
    this.subscriptions.dispose()
  }
}
