'use babel'

/* @flow */

import Path from 'path'
import FS from 'fs'
import Installer from '../'
import { exec } from 'sb-exec'
import { readJSON, writeJSON, exists } from 'motion-fs'

const { it } = require(process.env.SPEC_HELPER_SCRIPT)

describe('Installer', function() {
  const testRoot = '/tmp/motion-spec'
  const testPackageName = 'sb-promisify' // <-- choosing because it's lightweight
  const testPackagePath = Path.join(testRoot, 'node_modules', testPackageName)

  beforeEach(function() {
    waitsForPromise(async function() {
      await exec(process.env.SHELL, ['-c', `mkdir -p ${testRoot}`])
      await writeJSON(Path.join(testRoot, 'package.json'), {dependencies: {}})
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
    await installer.install(testPackageName, true)
    expect(await exists(testPackagePath)).toBe(true)
    const manifest = await readJSON(Path.join(testRoot, 'package.json'))
    expect(typeof manifest.dependencies[testPackageName]).toBe('string')
  })

  it('installs without saving', async function() {
    const installer = new Installer({rootDirectory: testRoot})
    await installer.install(testPackageName)
    expect(await exists(testPackagePath)).toBe(true)
    const manifest = await readJSON(Path.join(testRoot, 'package.json'))
    expect(typeof manifest.dependencies[testPackageName]).toBe('undefined')
  })

  it('uninstalls and saves properly', async function() {
    const installer = new Installer({rootDirectory: testRoot})
    await installer.install(testPackageName, true)
    await installer.uninstall(testPackageName, true)
    const manifest = await readJSON(Path.join(testRoot, 'package.json'))
    expect(typeof manifest.dependencies[testPackageName]).toBe('undefined')
  })

  it('uninstalls without saving', async function() {
    const installer = new Installer({rootDirectory: testRoot})
    await installer.install(testPackageName, true)
    await installer.uninstall(testPackageName)
    const manifest = await readJSON(Path.join(testRoot, 'package.json'))
    expect(typeof manifest.dependencies[testPackageName]).toBe('string')
  })

  it('installs peer dependencies properly', async function() {

    const onStarted = jasmine.createSpy('onStarted')
    const onProgress = jasmine.createSpy('onProgress')
    const onComplete = jasmine.createSpy('onComplete')

    const installer = new Installer({rootDirectory: testRoot})
    await installer.install(testPackageName, true)
    await writeJSON(Path.join(testPackagePath, 'package.json'), {name: testPackageName, version: '0.0.0', peerDependencies: {'sb-debounce': '>=1.0.0'}})
    await installer.installPeerDependencies(testPackageName, onStarted, onProgress, onComplete)

    expect(onStarted).toHaveBeenCalled()
    expect(onProgress).toHaveBeenCalled()
    expect(onComplete).toHaveBeenCalled()

    expect(onStarted.calls.length).toBe(1)
    expect(onProgress.calls.length).toBe(1)
    expect(onComplete.calls.length).toBe(1)

    expect(onStarted.mostRecentCall.args[0]).toEqual([['sb-debounce', '1.0.0']])
    expect(onProgress.mostRecentCall.args).toEqual(['sb-debounce', null])
  })

  it('tells if a module is installed or not', async function() {
    const installer = new Installer({rootDirectory: __dirname})
    expect(await installer.isInstalled('some-package')).toBe(false)
    expect(await installer.isInstalled('motion-fs')).toBe(true)
  })

})
