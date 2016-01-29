import _ from 'lodash'
import _glob from 'globby'
import readdirp from 'readdirp'
import path from 'path'
import fs, { copy, remove, mkdirs, readFile, writeFile, stat, ensureFile } from 'fs-extra'

import log from './log'
import handleError from './handleError'
import logError from './logError'

const p = path.join

const LOG = 'file'
const logWrap = (name, fn) => {
  return (...args) => {
    log(LOG, name, ...args)
    return fn(...args)
  }
}

// promisify
const rm = logWrap('rm', promisify(remove))
const mkdir = logWrap('mkdir', promisify(mkdirs))
const _readdir = promisify(readdirp)
const readdir = logWrap('readdir', (dir, opts = {}) => _readdir(Object.assign({ root: dir }, opts)).then(res => res.files))
const _readFilePromise = promisify(readFile)
const _readFile = logWrap('readFile', file => _readFilePromise(file, 'utf-8'))
const _writeFile = promisify(writeFile)
const readJSON = logWrap('readJSON', file => _readFile(file).then(res => JSON.parse(res)))
const writeJSON = logWrap('writeJSON', (path, str) => _writeFile(path, JSON.stringify(str)))
const touch = logWrap('touch', promisify(ensureFile))
const _copy = logWrap('copy', promisify(copy))
const exists = logWrap('exists', promisify(stat))
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

function promisify(callback){
  return function promisified(){
    const parameters = arguments
    const parametersLength = arguments.length + 1
    return new Promise((resolve, reject) => {
      Array.prototype.push.call(parameters, function(error, data) {
        if (error) {
          reject(error)
        } else resolve(data)
      })
      if (parametersLength === 1) {
        callback.call(this, parameters[0])
      } else if (parametersLength === 2) {
        callback.call(this, parameters[0], parameters[1])
      } else if (parametersLength === 3) {
        callback.call(this, parameters[0], parameters[1], parameters[2])
      } else if (parametersLength === 4) {
        callback.call(this, parameters[0], parameters[1], parameters[2], parameters[3])
      } else {
        callback.apply(this, parameters)
      }
    })
  }
}

function vinyl(basePath, path, contents) {
  const cwd = '/'
  const base = basePath + '/'
  return { cwd, base, path, contents }
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
  glob,
  promisify,
  vinyl
}
