import readdirp from 'readdirp'
import mkdirp from 'mkdirp'
import jf from 'jsonfile'
import fs from 'fs'
import rimraf from 'rimraf'
import copyFile from './copyFile'
import path from 'path'
import _touch from 'touch'

import { Promise } from 'bluebird'
Promise.longStackTraces()

// promisify
const rmdir = Promise.promisify(rimraf)
const mkdir = Promise.promisify(mkdirp)
const readdir = Promise.promisify(readdirp)
const readJSON = Promise.promisify(jf.readFile)
const writeJSON = Promise.promisify(jf.writeFile)
const readFile = Promise.promisify(fs.readFile)
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

export default {
  p,
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
  exists
}