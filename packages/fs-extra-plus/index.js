import _promisify from 'sb-promisify'
import lodash from 'lodash'
import _glob from 'globby'
import readdirp from 'readdirp'
import _path from 'path'
import _replace from 'replace'
import fse from 'fs-extra'
import _log from './log'
import _handleError from './handleError'
import _logError from './logError'
import { Emitter } from 'sb-event-kit'

// helpers
export const replace = _replace
export const log = _log
export const logError = _logError
export const handleError = _handleError
export const promisify = _promisify
export const emitter = new Emitter()
export const path = _path
export const p = _path.join
export const _ = lodash

// files
export const fs = fse
export const rm = promisify(fs.remove)
export const mkdir = promisify(fs.mkdirs)
export const move = promisify(fs.move)
export const writeFile = promisify(fs.writeFile)
const _readdir = promisify(readdirp)
export const readdir = (dir, opts = {}) => _readdir(Object.assign({ root: dir }, opts)).then(res => res.files)
const readFilePromise = promisify(fs.readFile)
export const readFile = file => readFilePromise(file, 'utf-8')
export const readJSON = file => readFile(file).then(res => JSON.parse(res))
export const writeJSON = (path, str) => writeFile(path, JSON.stringify(str))
export const touch = promisify(fs.ensureFile)
export const copy = promisify(fs.copy)
export const glob = _glob
export const exists = where => new Promise((res, rej) => fs.stat(where, err => res(!err)))
// TODO use promises
export const recreateDir = (dir) =>
  new Promise((res, rej) => {
    fs.remove(dir, err => {
      if (err) return rej(err)
      fs.mkdirs(dir, err => {
        if (err) return rej(err)
        res(dir)
      });
    })
  })

export async function globCopy(pattern, dest, opts = {}) {
  const srcs = await glob(pattern, { dot: false, nodir: true, ...opts })
  await Promise.all(srcs.map(f => _copy(p(opts.cwd || '', f), p(dest, f))))
}

export function sanitize(str) {
  return str.replace(/[^a-zA-Z]/, '')
}

export function vinyl(basePath, path, contents) {
  const cwd = '/'
  const base = basePath + '/'
  return { cwd, base, path, contents }
}

let debouncers = {}
export function debounce(key, time, cb) {
  if (debouncers[key]) clearTimeout(debouncers[key])
  debouncers[key] = setTimeout(cb, time)
}
