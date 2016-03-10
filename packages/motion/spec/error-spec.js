'use babel'

/* @flow */

import { MotionError, ERROR_CODE } from '../lib/error'

const { it } = require(process.env.SPEC_HELPER_SCRIPT)

describe('MotionError', function() {
  it('sets message and code according to given code', function() {
    const code = ERROR_CODE.NOT_MOTION_APP
    const error = new MotionError(code)
    expect(typeof error.message).toBe('string')
    expect(error.code).toBe(code)
  })

  it('is an instance of error', function() {
    const code = ERROR_CODE.NOT_MOTION_APP
    const error = new MotionError(code)
    expect(error instanceof Error).toBe(true)
  })
})
