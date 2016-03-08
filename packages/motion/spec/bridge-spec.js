'use babel'

import {EventEmitter} from 'events'
import { Bridge } from '../lib/runner/bridge.js'
const { it, wait } = require(process.env.SPEC_HELPER_SCRIPT)

describe('Bridge', function() {
  let bridge

  beforeEach(function() {
    bridge = new Bridge()
  })
  afterEach(function() {
    bridge.dispose()
  })

  function createDummyConnection() {
    const connection = new EventEmitter()
    spyOn(connection, 'on').andCallThrough()
    spyOn(connection, 'emit').andCallThrough()
    connection.send = jasmine.createSpy('connection::send')
    return connection
  }

  describe('::activate', function() {
    it('resolves when the server has started listening', async function() {
      expect(bridge.server).toBe(null)
      await bridge.activate()
      expect(bridge.server._server.address()).not.toBe(null)
    })
  })

  describe('::handleConnection', function() {
    it('sends initialization messages', function() {
      const connection = createDummyConnection()
      bridge.handleConnection(connection)
      expect(connection.on).toHaveBeenCalled()
      expect(connection.send).toHaveBeenCalled()
      expect(connection.send.calls.length).toBe(2)
      expect(JSON.parse(connection.send.calls[0].args[0])._type).toBe('motion:baseDir')
      expect(JSON.parse(connection.send.calls[1].args[0])._type).toBe('motion:opts')
    })
    it('sends cached messages', function() {
      const connection = createDummyConnection()
      bridge.broadcast('editor:error', {}, 'editor')
      bridge.handleConnection(connection)
      expect(connection.send.calls.length).toBe(3)
      expect(JSON.parse(connection.send.calls[2].args[0])._type).toBe('editor:error')
    })
  })

  describe('::broadcast', function() {
    it('encodes the message and sends it through ::broadcastRaw', function() {
      spyOn(bridge, 'encodeMessage').andCallThrough()
      spyOn(bridge, 'broadcastRaw').andCallThrough()
      bridge.broadcast('editor:error', {})
      expect(bridge.encodeMessage).toHaveBeenCalled()
      expect(bridge.broadcastRaw).toHaveBeenCalled()
      expect(typeof bridge.broadcastRaw.mostRecentCall.args[0]).toBe('string')
    })
  })

  describe('::encodeMessage', function() {
    it('returns a string', function() {
      expect(typeof bridge.encodeMessage('wow', {})).toBe('string')
    })
    it('adds timestamp and type to messages', function() {
      const message = JSON.parse(bridge.encodeMessage('wow', {}))
      expect(message._type).toBe('wow')
      expect(typeof message.timestamp).toBe('number')
    })
  })

  describe('::broadcastRaw', function() {
    it('emits if there\'s active connection', function() {
      const connection = createDummyConnection()
      bridge.handleConnection(connection)
      expect(connection.send.calls.length).toBe(2)
      bridge.broadcastRaw('asd')
      expect(connection.send.calls.length).toBe(3)
      expect(bridge.cache.size).toBe(0)
    })
    it('caches if a cache key is found', function() {
      bridge.broadcastRaw('Hey!', 'key')
      expect(bridge.cache.size).toBe(1)
      expect(bridge.cache.get('key')).toBe('Hey!')
    })
    it('caches even though there\'s an active connection', function() {
      const connection = createDummyConnection()
      bridge.handleConnection(connection)
      expect(connection.send.calls.length).toBe(2)
      bridge.broadcastRaw('asd', 'key')
      expect(connection.send.calls.length).toBe(3)
      expect(bridge.cache.size).toBe(1)
      expect(bridge.cache.get('key')).toBe('asd')
    })
  })

  it('properly replies to messages if they have an id', async function() {
    const connection = createDummyConnection()
    bridge.handleConnection(connection)
    bridge.onDidReceiveMessage('something', function(message) {
      message.result = {something: true}
    })
    connection.emit('message', JSON.stringify({_type: 'something', id: 2}), {})
    await wait(0)
    const mostRecent = JSON.parse(connection.send.mostRecentCall.args[0])
    expect(mostRecent._type).toBe('something')
    expect(mostRecent.id).toBe(2)
    expect(mostRecent.something).toBe(true)
  })
})
