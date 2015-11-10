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

// promisify
const rmdir = Promise.promisify(rimraf)
const mkdir = Promise.promisify(mkdirp)
const readdir = Promise.promisify(readdirp)
const readJSON = Promise.promisify(jf.readFile)
const writeJSON = Promise.promisify(jf.writeFile)
const fsReadFile = Promise.promisify(fs.readFile)
const readFile = path => fsReadFile(path, 'utf-8')
const writeFile = Promise.promisify(fs.writeFile)
const touch = Promise.promisify(_touch)
const copy = Promise.promisify(copyFile)
const exists = Promise.promisify(fs.stat)

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