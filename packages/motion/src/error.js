/* @flow */

export const ERROR_CODE = {
  NOT_MOTION_APP: 'NOT_MOTION_APP',
  ALREADY_MOTION_APP: 'ALREADY_MOTION_APP',
  ENOENT: 'ENOENT'
}

export const MESSAGES = {
  NOT_MOTION_APP: 'Unable to run, directory is not a motion app',
  ALREADY_MOTION_APP: 'Directory is already a motion app',
  ENOENT: 'File or directory not found'
}

export class MotionError extends Error {
  code: string;
  motion: boolean;

  constructor(code: string) {
    super(MESSAGES[code])
    this.code = code
    this.motion = true
  }
}
