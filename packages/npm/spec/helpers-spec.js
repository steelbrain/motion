'use babel'

import Path from 'path'
import { versionFromRange, getManifestPath, isNPMError } from '../lib/helpers'
const { it } = require(process.env.SPEC_HELPER_SCRIPT)
const rootDirectory = Path.normalize(Path.join(__dirname, '..'))

describe('versionFromRange', function() {
  it('extracts a version from semver range', function() {
    const version = '^2.2.0'
    expect(versionFromRange(version)).toEqual(['2.2.0'])
  })
  it('works even on complex ranges', function() {
    const version = '>=1.4.0 <2.0.0'
    expect(versionFromRange(version)).toEqual(['1.4.0', '2.0.0'])
  })
})

describe('getManifestPath', function() {
  it('works on children', async function() {
    expect(await getManifestPath('motion-fs', rootDirectory)).toBe(Path.join(rootDirectory, 'node_modules', 'motion-fs', 'package.json'))
    try {
      await getManifestPath('sb-hello', rootDirectory)
      expect(false).toBe(true)
    } catch (_) {
      expect(_.message).toContain('Unable to determine')
    }
  })
  it('works on parents', async function() {
    expect(await getManifestPath('babel', rootDirectory)).toBe(Path.normalize(Path.join(rootDirectory, '..', '..', 'node_modules', 'babel', 'package.json')))
  })
})

describe('isNPMError', function() {
  it('stays silent on warn', function() {
    expect(isNPMError('npm WARN')).toBe(false)
  })
  it('cries on error', function() {
    expect(isNPMError('npm ERR')).toBe(true)
  })
})
