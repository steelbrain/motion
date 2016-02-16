'use babel'

import {EventEmitter} from 'events'
import {it, wait} from '../../helpers'
import {Bridge} from '../../../packages/motion/lib/runner/bridge.js'

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
})
