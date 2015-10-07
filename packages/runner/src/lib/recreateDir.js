var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var handleError = require('./handleError');
import { Promise } from 'bluebird'

const recreateDir = (dir) =>
  new Promise((res, rej) => {
    rimraf(dir, err => {
      if (err) return rej(err)
      mkdirp(dir, err => {
        if (err) return rej(err)
        res(dir)
      });
    })
  })

export default recreateDir