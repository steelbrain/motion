/* @flow */

export const ERROR_CODE = {
  NOT_MOTION_APP: 1,
  ALREADY_MOTION_APP: 2,
  ENOENT: 3
}

export const MESSAGES = {
  NOT_MOTION_APP: 'Unable to run, directory is not a motion app',
  ALREADY_MOTION_APP: 'Directory is already a motion app',
  ENOENT: 'File or directory not found'
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
