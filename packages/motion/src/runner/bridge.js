import { Emitter, CompositeDisposable } from 'sb-event-kit'
import { createServer } from 'ws'
import websocketPort from './lib/wport'
import Cache from './cache'
import { log, handleError } from './lib/fns'
import getOptions from './opts'

export default new class Bridge {
  constructor() {
    this.subscriptions = new CompositeDisposable()
    this.emitter = new Emitter()
    this.connections = new Set()
    this.server = null
    this.queue = {}

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
          log.bridge('Ignoring message because its binary')
          return
        }
        try {
          const message = JSON.parse(data)
          log.bridge('IN', message._type)
          this.emitter.emit(`message:${message._type}`, message)
        } catch (e) {
          handleError(e)
        }
      })
      this.welcomeConnection(connection)
    })
  }

  welcomeConnection(connection) {
    connection.send(this.encodeMessage('motion:baseDir', {
      dir: Cache.baseDir()
    }))
    connection.send(this.encodeMessage('motion:opts', getOptions()))

    for (const key in this.queue) {
      connection.send(this.queue[key])
    }
  }

  broadcast(type, message, cacheKey = null) {
    this.broadcastRaw(this.encodeMessage(type, message), cacheKey)
  }

  encodeMessage(type, message = {}) {
    log.bridge('OUT', type)
    return JSON.stringify(Object.assign({
      _type: type,
      timestamp: Date.now()
    }, message))
  }

  broadcastRaw(message, cacheKey = null) {
    if (typeof message !== 'string') {
      throw new Error('Malformed message given')
    }

    // If we have any active connections
    if (this.connections.size) {
      this.connections.forEach(function(connection) {
        connection.send(message)
      })
    }

    if (cacheKey !== null) {
      this.queue[cacheKey] = message
    }
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
    this.queue = null
  }
}