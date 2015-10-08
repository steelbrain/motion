import { Promise } from 'bluebird'
import fs from 'fs'
import webpack from 'webpack'

import cache from '../cache'
import exec from '../lib/exec'
import log from '../lib/log'
import {
  p,
  mkdir,
  readFile,
  writeFile,
  writeJSON,
  readJSON } from '../lib/fns'

let OPTS

async function init(_opts) {
  OPTS = _opts
  OPTS.outDir = p(OPTS.dir, 'deps')
  OPTS.entryFile = p(OPTS.outDir, 'deps.js')
  OPTS.cacheFile = p(OPTS.outDir, 'deps.json')
  OPTS.outFile = p(OPTS.outDir, 'packages.js')
  OPTS.packageJSON = p(OPTS.dir, 'package.json')
  log('npm: init opts: ', OPTS)

  try {
    await readDeps()
    await mkdir(OPTS.outDir)
  }
  catch(e) { console.error(e) }
}

// package.json => packages.js
function bundle() {
  log('npm: bundle')
  return new Promise(async (res, rej) => {
    try {
      const file = await readFile(OPTS.packageJSON)
      const deps = Object.keys(JSON.parse(file).dependencies)
      const depNames = deps.filter(p => ['flint-js', 'react'].indexOf(p) < 0)
      log('npm: bundle: depNames:', depNames)
      await writeDeps(depNames)
      await pack()
      res()
    }
    catch(e) { console.error(e) }
  })
}

// => deps.json
// => deps.js
const depRequireString = name => `window.__flintPackages["${name}"] = require("${name}");`
async function writeDeps(deps) {
  return new Promise((resolve) => {
    const requireString = deps.map(depRequireString).join("\n")
    await writeFile(OPTS.entryFile, requireString)
    await writeJSON(OPTS.cacheFile, `{ "deps": ${JSON.stringify(deps)} }`)
    resolve()
  })
}

// <= deps.json
// <= package.json
function readPackageJSON() {
  log('readPackageJSON')
  return readFile(OPTS.dir + '/package.json')
    .then(data => {
      const deps = Object.keys(JSON.parse(data).dependencies)
      log('readPackageJSON:', deps)
      cache.setInPackage(deps)
      return deps
    })
}

// webpack
// deps.js => packages.js
async function pack(file, out) {
  log('npm: pack')
  return new Promise((res, rej) => {
    webpack({
      entry: OPTS.entryFile,
      externals: { react: 'React', bluebird: '_bluebird' },
      output: { filename: OPTS.outFile }
    }, err => {
      if (err) return rej(err)
      res()
    })
  })
}

const findRequires = source =>
  getMatches(source, /require\(\s*['"]([^\'\"]+)['"]\s*\)/g, 1) || []

// <= file, source
//  > install new deps
// => update cache
function scanFile(file, source, opts) {
  try {
    const all = cache.getImports()
    const found = findRequires(source)
    const fresh = found.filter(f => all.indexOf(f) < 0)

    log('scanFile: Found packages in file:', found)
    log('scanFile: New packages:', fresh)

    // no new ones found
    if (!fresh.length) return

    const already = found.filter(f => all.indexOf(f) >= 0)

    let installed = []
    let installing = fresh

    // install deps one by one
    const installNext = async () => {
      const dep = installing.shift()
      log('scanFile: Start install:', dep)
      opts.onPackageStart(dep)

      try {
        await save(dep)
        log('scanFile: package installed', dep)
        installed.push(dep)
        await bundle()
        opts.onPackageFinish(dep)
        next()
      } catch(e) {
        log('scanFile: package install failed', dep)
        opts.onPackageError(dep, error)
        next()
      }
    }

    // loop
    const next = () => {
      if (installing.length) return installNext()
      done()
    }

    const done = () => {
      // cache newly installed + already
      cache.setImports(file, installed.concat(already))
      logInstalled(installed)
    }

    installNext()
  }
  catch (e) {
    console.log('Error installing dependency!')
    console.log(e)
    console.log(e.message)
  }
}

// npm install --save 'name'
function save(name) {
  log('npm: save:', name)
  return new Promise((res, rej) => {
    exec('npm install --save ' + name, OPTS.dir, err => {
      if (err) rej('Install failed for package ' + name)
      else res(name)
    })
  })
}

// npm install
function install(dir) {
  return new Promise((res, rej) => {
    exec('npm install', dir || OPTS.dir, err => {
      if (err) rej(err)
      else res()
    })
  })
}

function getMatches(string, regex, index) {
  index || (index = 1) // default to the first capturing group
  var matches = []
  var match
  while (match = regex.exec(string)) {
    matches.push(match[index])
  }
  return matches
}

function logInstalled(deps) {
  if (!deps.length) return
  console.log()
  console.log(`Installed ${deps.length} packages`.blue.bold)
  deps.forEach(dep => {
    console.log(` - ${dep}`)
  })
  console.log()
}

export default {
  init, save, install, scanFile
}