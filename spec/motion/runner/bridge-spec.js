'use babel'

import {it, wait} from '../../helpers'
import {Bridge} from '../../../packages/motion/lib/runner/bridge.js'

describe('Bridge', function() {
  let bridge

  beforeEach(function() {
    if (bridge) {
      bridge.dispose()
    }
    bridge = new Bridge()
  })

  describe('::activate', function() {
    it('resolves when the server has started listening', async function() {
      expect(bridge.server).toBe(null)
      await bridge.activate()
      expect(bridge.server._server.address()).not.toBe(null)
    })
  })

})
