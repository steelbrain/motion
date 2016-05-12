'use babel'

/* @flow */

import { allowUnsafeEval } from 'loophole'
import Path from 'path'

let State

allowUnsafeEval(function() {
  State = require('../lib/state').default
})

const { it } = require(process.env.SPEC_HELPER_SCRIPT)

describe('Motion State', function() {
  it('resumes an existing state', async function() {
    const statePath = Path.join(__dirname, 'fixtures', 'state.json')
    const configPath = Path.join(__dirname, 'fixtures', 'config.json')
    const state = await State.create(statePath, configPath)
    expect(state.get().running).toBe(true)
  })

  it('creates a shallow in memory state if file does not exist', async function() {
    const statePath = Path.join(__dirname, 'fixtures', 'state-non-existent.json')
    const configPath = Path.join(__dirname, 'fixtures', 'config.json')
    const state = await State.create(statePath, configPath)
    expect(state.get().running).toBe(false)
  })
})
