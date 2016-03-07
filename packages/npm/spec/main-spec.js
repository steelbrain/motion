'use babel'

/* @flow */

import Path from 'path'
import FS from 'fs'
import Installer from '../'
import { exec } from 'sb-exec'
import { readFile, writeFile, readJSON, exists } from 'motion-fs'

// const { it } = require(process.env.SPEC_HELPER_SCRIPT)
const { it } = require('/Users/steel/w/motion/scripts/../spec/helpers.js')

describe('Installer', function() {
  const testRoot = '/tmp/motion-spec'
  const testPackageName = 'sb-promisify' // <-- choosing because it's lightweight
  const testPackagePath = Path.join(testRoot, 'node_modules', 'sb-promisify')

  beforeEach(function() {
    waitsForPromise(async function() {
      await exec(process.env.SHELL, ['-c', `mkdir -p ${testRoot}`])
      await writeFile(Path.join(testRoot, 'package.json'), '{"dependencies": {}}')
    })
  })

  afterEach(function() {
    waitsForPromise(async function() {
      await exec(process.env.SHELL, ['-c', `rm -rf ${testRoot} || true`])
    })
  })

  it('installs and saves properly', async function() {
    console = require('console')
    const installer = new Installer({rootDirectory: testRoot})
    await installer.install('sb-promisify', true)
    expect(await exists(testPackagePath)).toBe(true)
    const manifest = await readJSON(Path.join(testRoot, 'package.json'))
    expect(typeof manifest.dependencies['sb-promisify']).toBe('string')
  })

  it('installs without saving', async function() {
    console = require('console')
    const installer = new Installer({rootDirectory: testRoot})
    await installer.install('sb-promisify')
    expect(await exists(testPackagePath)).toBe(true)
    const manifest = await readJSON(Path.join(testRoot, 'package.json'))
    expect(typeof manifest.dependencies['sb-promisify']).toBe('undefined')
  })

})
