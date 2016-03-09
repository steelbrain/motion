/* @flow */
import { Emitter, CompositeDisposable } from 'sb-event-kit'
import { Server } from 'ws'
import disposableEvent from 'disposable-event'
import websocketPort from './lib/wport'
import Cache from './cache'
import { log, handleError } from './lib/fns'
import getOptions from './opts'

import type { Disposable } from 'sb-event-kit'
import type WebSocket from 'ws'

type Message = {
  _type: string,
  timestamp: number
}

export class Bridge {
  cache: Map<string, string>;
  server: ?Server;
  emitter: Emitter;
  connections: Set<WebSocket>;
  subscriptions: CompositeDisposable;

  constructor() {
    this.cache = new Map()
    this.server = null
    this.emitter = new Emitter()
    this.connections = new Set()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.emitter)
  }

  activate(): Promise {
    return new Promise((resolve, reject) => {
      const server = this.server = new Server({
        port: websocketPort()
      })

      const subscriptions = new CompositeDisposable()
      subscriptions.add(disposableEvent(server, 'listening', function() {
        subscriptions.dispose()
        resolve()
      }))

      subscriptions.add(disposableEvent(server, 'error', function(error) {
        subscriptions.dispose()
        reject(error)
      }))

      this.subscriptions.add(disposableEvent(server, 'connection', connection => this.handleConnection(connection)))
    })
  }
  handleConnection(connection: WebSocket) {
    this.connections.add(connection)

    connection.on('close', () => {
      this.connections.delete(connection)
    })

    connection.on('message', async (data, flags) => {
      if (flags.binary) {
        log.bridge('Ignoring message because it\'s binary')
        return
      }

      let message

      try {
        message = JSON.parse(data)
        log.bridge('IN', message._type)
        await this.emitter.emit(`message:${message._type}`, message)
      }
      catch (error) {
        handleError(error)
      }
      finally {
        if (message && message.id) {
          connection.send(this.encodeMessage(message._type, Object.assign({id: message.id}, message.result)))
        }
      }
    })

    connection.send(this.encodeMessage('motion:baseDir', {
      dir: Cache.baseDir()
    }))
    connection.send(this.encodeMessage('motion:opts', getOptions()))

    for (const value of this.cache.values()) {
      connection.send(value)
    }
  }

  broadcast(type: string, message: Message, cacheKey: ?string = null) {
    this.broadcastRaw(this.encodeMessage(type, message), cacheKey)
  }

  encodeMessage(type: string, message: Object): string {
    log.bridge('OUT', type)
    return JSON.stringify(Object.assign({
      _type: type,
      timestamp: Date.now()
    }, message))
  }

  broadcastRaw(message: string, cacheKey: ?string = null) {
    if (typeof message !== 'string') {
      throw new Error('Malformed message given')
    }

    // If we have any active connections
    if (this.connections.size) {
      this.connections.forEach(function(connection) {
        connection.send(message)
      })
    }

    if (cacheKey) {
      this.cache.set(cacheKey, message)
    }
  }

  onDidReceiveMessage(type: string, callback: Function): Disposable {
    return this.emitter.on(`message:${type}`, callback)
  }

  dispose() {
    if (this.server) {
      this.server.close()
    }
    this.connections.clear()
    this.subscriptions.dispose()
    this.cache.clear()
  }
}

export default new Bridge()
