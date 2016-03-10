'use babel'

/* @flow */

import Path from 'path'
import State from '../lib/state'

const { it } = require(process.env.SPEC_HELPER_SCRIPT)

describe('Motion State', function() {
  it('resumes an existing state', async function() {
    const statePath = Path.join(__dirname, 'fixtures', 'state.json')
    const state = await State.create(statePath)
    expect(state.get().running).toBe(true)
  })

  it('creates a shallow in memory state if file does not exist', async function() {
    const statePath = Path.join(__dirname, 'fixtures', 'state-non-existent.json')
    const state = await State.create(statePath)
    expect(state.get().running).toBe(false)
  })
})
