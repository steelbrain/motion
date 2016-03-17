'use babel'

/* @flow */

import * as Helpers from '../lib/helpers'

const { it } = require(process.env.SPEC_HELPER_SCRIPT)

describe('Helpers', function() {
  describe('getModuleName', function() {
    it('returns name from a request', function() {
      expect(Helpers.getModuleName({ request: 'some-module' })).toBe('some-module')
      expect(Helpers.getModuleName({ request: 'motion' })).toBe('motion')
    })
    it('makes sure theres a loader in name for loaders', function() {
      expect(Helpers.getModuleName({ request: 'babel-loader' }, true)).toBe('babel-loader')
      expect(Helpers.getModuleName({ request: 'babel' }, true)).toBe('babel-loader')
    })
  })

  describe('isBuiltin', function() {
    it('works', function() {
      expect(Helpers.isBuiltin('fs')).toBe(true)
      expect(Helpers.isBuiltin('motion')).toBe(false)
      expect(Helpers.isBuiltin('child_process')).toBe(true)
      expect(Helpers.isBuiltin('motion-fs')).toBe(false)
    })
  })

  describe('getRootDirectory', function() {
    it('returns the root directory', function() {
      expect(Helpers.getRootDirectory()).toBe(process.cwd())
    })
  })

  describe('extractModuleName', function() {
    it('extracts names from deep requires', function() {
      expect(Helpers.extractModuleName('webpack/asd/asd')).toBe('webpack')
    })
    it('returns null for invalid ones', function() {
      expect(Helpers.extractModuleName('~asd')).toBe(null)
      expect(Helpers.extractModuleName('webpack and amd')).toBe(null)
    })
  })
})
