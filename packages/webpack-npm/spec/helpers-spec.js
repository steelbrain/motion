'use babel'

/* @flow */

import * as Helpers from '../lib/helpers'

const { it } = require(process.env.SPEC_HELPER_SCRIPT)

describe('Helpers', function() {
  describe('normalizeModuleName', function() {
    it('returns name from a request', function() {
      expect(Helpers.normalizeModuleName('some-module')).toBe('some-module')
      expect(Helpers.normalizeModuleName('motion')).toBe('motion')
    })
    it('makes sure theres a loader in name for loaders', function() {
      expect(Helpers.normalizeModuleName('babel-loader', true)).toBe('babel-loader')
      expect(Helpers.normalizeModuleName('babel', true)).toBe('babel-loader')
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
