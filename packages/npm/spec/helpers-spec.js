'use babel'

const { it } = require(process.env.SPEC_HELPER_SCRIPT)
import { exists, versionFromRange } from '../lib/helpers'

describe('exists', function() {
  it('works', async function() {
    expect(await exists(__filename)).toBe(true)
    expect(await exists('/tmp/non-existent-file')).toBe(false)
  })
})

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
