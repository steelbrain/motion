'use babel'

/* @flow */

import Path from 'path'
import * as Helpers from '../'

const { it } = require(process.env.SPEC_HELPER_SCRIPT)

describe('File system helpers', function() {
  const nonExistentFile = '/tmp/some-non-existent-file'

  describe('exists', function() {
    it('returns false if the file does not exist', async function() {
      expect(await Helpers.exists(nonExistentFile)).toBe(false)
    })
    it('returns true if the file exists', async function() {
      expect(await Helpers.exists(__filename)).toBe(true)
    })
  })

  describe('readFile', function() {
    it('throws error if the file does not exist', async function() {
      try {
        await Helpers.readFile(nonExistentFile)
        expect(false).toBe(true)
      } catch (_) {
        expect(_.message).toContain('ENOENT')
      }
    })
    it('returns the buffer if the file was successfully read', async function() {
      const contents = await Helpers.readFile(__filename)
      expect(Buffer.isBuffer(contents)).toBe(true)
    })
  })

  describe('writeFile', function() {
    it('throws error if it can not write to file', async function() {
      try {
        await Helpers.writeFile(Path.join(nonExistentFile, 'test'))
        expect(false).toBe(true)
      } catch (_) {
        expect(_.message).toContain('ENOENT')
      }
    })
    it('writes the file if possible', async function() {
      await Helpers.writeFile(nonExistentFile, '')
      expect(await Helpers.exists(nonExistentFile)).toBe(true)
      await Helpers.unlink(nonExistentFile)
    })
  })

  describe('unlink', function() {
    it('throws error if it can not unlink a file', async function() {
      try {
        await Helpers.unlink(nonExistentFile)
        expect(false).toBe(true)
      } catch (_) {
        expect(_.message).toContain('ENOENT')
      }
    })
    it('unlinks if possible', async function() {
      await Helpers.writeFile(nonExistentFile, 'nonExistentFile')
      expect(await Helpers.exists(nonExistentFile)).toBe(true)
      await Helpers.unlink(nonExistentFile)
      expect(await Helpers.exists(nonExistentFile)).toBe(false)
    })
  })

  describe('readJSON', function() {
    it('throws error if the file isn\'t valid JSON', async function() {
      try {
        await Helpers.readJSON(__filename)
        expect(false).toBe(true)
      } catch (_) {
        expect(_.message).toContain('Unexpected token')
      }
    })
    it('throws if the file does not exist', async function() {
      try {
        const contents = await Helpers.readJSON(nonExistentFile)
      } catch (_) {
        expect(_.message).toContain('ENOENT')
      }
    })
    it('reads properly if possible', async function() {
      const contents = await Helpers.readJSON(Path.join(__dirname, 'fixtures', 'example.json'))
      expect(contents).toEqual({some: 'thing'})
    })
  })

  describe('writeJSON', function() {
    it('throws error if it can not write the file', async function() {
      try {
        await Helpers.writeJSON(Path.join(nonExistentFile, 'asd'))
        expect(false).toBe(true)
      } catch (_) {
        expect(_.message).toContain('ENOENT')
      }
    })
    it('can write properly', async function() {
      await Helpers.writeJSON(nonExistentFile, {some: 'thing'})
      expect(await Helpers.readJSON(nonExistentFile)).toEqual({some: 'thing'})
      await Helpers.unlink(nonExistentFile)
    })
  })

})
