import readdirp from 'readdirp'
import mkdirp from 'mkdirp'
import jf from 'jsonfile'
import fs from 'fs'
import rimraf from 'rimraf'
import copyFile from './copyFile'
import path from 'path'
import _touch from 'touch'

import log from './log'
import handleError from './handleError'

import { Promise } from 'bluebird'
Promise.longStackTraces()

const LOG = 'file'
const logWrap = (name, fn) => {
  return (...args) => {
    log(LOG, name, ...args)
    return fn(...args)
  }
}

// promisify
const rmdir = logWrap('rmdir', Promise.promisify(rimraf))
const mkdir = logWrap('mkdir', Promise.promisify(mkdirp))
const readdir = logWrap('readdir', Promise.promisify(readdirp))
const readJSON = logWrap('readJSON', Promise.promisify(jf.readFile))
const writeJSON = logWrap('writeJSON', Promise.promisify(jf.writeFile))
const fsReadFile = logWrap('fsReadFile', Promise.promisify(fs.readFile))
const readFile = logWrap('readFile', path => fsReadFile(path, 'utf-8'))
const writeFile = logWrap('writeFile', Promise.promisify(fs.writeFile))
const touch = logWrap('touch', Promise.promisify(_touch))
const copy = logWrap('copy', Promise.promisify(copyFile))
const exists = logWrap('exists', Promise.promisify(fs.stat))

const p = path.join
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

function sanitize(str) {
  return str.replace(/[^a-zA-Z]/, '')
}

export default {
  p,
  path,
  mkdir,
  rmdir,
  copy,
  recreateDir,
  readdir,
  readJSON,
  writeJSON,
  readFile,
  writeFile,
  copyFile,
  touch,
  exists,
  sanitize,
  log,
  handleError
}