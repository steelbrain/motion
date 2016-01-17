import _ from 'lodash'
import _glob from 'globby'
import readdirp from 'readdirp'
import jf from 'jsonfile'
import path from 'path'
import fs, { copy, remove, mkdirs, readFile, writeFile, stat, ensureFile } from 'fs-extra'

import log from './log'
import handleError from './handleError'
import logError from './logError'

import { Promise } from 'bluebird'
Promise.longStackTraces()

const p = path.join

const LOG = 'file'
const logWrap = (name, fn) => {
  return (...args) => {
    log(LOG, name, ...args)
    return fn(...args)
  }
}

// promisify
const rm = logWrap('rm', Promise.promisify(remove))
const mkdir = logWrap('mkdir', Promise.promisify(mkdirs))
const readdir = logWrap('readdir', Promise.promisify(readdirp))
const readJSON = logWrap('readJSON', Promise.promisify(jf.readFile))
const writeJSON = logWrap('writeJSON', Promise.promisify(jf.writeFile))
const _readFilePromise = Promise.promisify(readFile)
const _readFile = logWrap('readFile', _ => _readFilePromise(_, 'utf-8'))
const _writeFile = Promise.promisify(writeFile)
const touch = logWrap('touch', Promise.promisify(ensureFile))
const _copy = logWrap('copy', Promise.promisify(copy))
const exists = logWrap('exists', Promise.promisify(stat))
const glob = logWrap('glob', _glob)

const recreateDir = (dir) =>
  new Promise((res, rej) => {
    remove(dir, err => {
      if (err) return rej(err)
      mkdirs(dir, err => {
        if (err) return rej(err)
        res(dir)
      });
    })
  })

async function globCopy(pattern, dest, opts = {}) {
  const srcs = await glob(pattern, { dot: false, nodir: true, ...opts })
  await* srcs.map(f => _copy(p(opts.cwd || '', f), p(dest, f)))
}

function sanitize(str) {
  return str.replace(/[^a-zA-Z]/, '')
}

export default {
  _,
  p,
  fs,
  path,
  mkdir,
  rm,
  recreateDir,
  readdir,
  readJSON,
  writeJSON,
  readFile: _readFile,
  writeFile: _writeFile,
  copy: _copy,
  globCopy,
  touch,
  exists,
  sanitize,
  log,
  handleError,
  logError,
  glob
}
