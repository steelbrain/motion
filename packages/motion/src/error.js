/* @flow */

export const ERROR_CODE = {
  NOT_MOTION_APP: 1
}

export const MESSAGES = {
  NOT_MOTION_APP: 'Unable to run, directory is not a motion app'
}

export class MotionError extends Error {
  code: number;
  motion: boolean;

  constructor(code: number) {
    super(MESSAGES[code])
    this.code = code
    this.motion = true
  }
}
