'use babel'

/* @flow */

import Path from 'path'
import { exec } from 'sb-exec'
import { exists } from 'motion-fs'
const { it } = require(process.env.SPEC_HELPER_SCRIPT)

describe('motion-webpack-npm', function() {
  const EXAMPLE_PROJECT_DIR = Path.join(__dirname, 'fixtures', 'example-webpack-project')
  const EXAMPLE_PROJECT_MODULES_DIR = Path.join(EXAMPLE_PROJECT_DIR, 'node_modules')
  const WEBPACK_EXECUTABLE_PATH = Path.join(__dirname, '..', 'node_modules', '.bin', 'webpack')

  afterEach(function() {
    waitsForPromise(async function() {
      await exec(process.env.SHELL, ['-c', `rm -rf ${EXAMPLE_PROJECT_MODULES_DIR}`])
    })
  })

  it('works', async function() {
    expect(await exists(EXAMPLE_PROJECT_MODULES_DIR)).toBe(false)
    const output = await exec(WEBPACK_EXECUTABLE_PATH, [], {cwd: EXAMPLE_PROJECT_DIR})
    expect(await exists(EXAMPLE_PROJECT_MODULES_DIR)).toBe(true)
    expect(output).toContain(`started 1 [ [ 'randomcolor', 'x.x.x' ] ]`)
    expect(output).toContain(`started 2 [ [ 'sb-promisify', 'x.x.x' ] ]`)
    expect(output).toContain(`progress 1 randomcolor null`)
    expect(output).toContain(`progress 2 sb-promisify null`)
    expect(output).toContain(`complete 1`)
    expect(output).toContain(`complete 2`)
  })
})
