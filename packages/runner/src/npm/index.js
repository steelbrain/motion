import { Promise } from 'bluebird'
import fs from 'fs'
import webpack from 'webpack'

import cache from '../cache'
import exec from '../lib/exec'
import log from '../lib/log'
import { p, mkdir, readFile } from '../lib/fns'

let OPTS

export async function init(_opts) {
  OPTS = _opts
  OPTS.outDir = p(OPTS.dir, 'deps')
  OPTS.entry = p(OPTS.outDir, 'deps.js')
  OPTS.outFile = p(OPTS.outDir, 'packages.js')
  OPTS.packageJSON = p(OPTS.dir, 'package.json')
  log('npm: init opts: ', OPTS)
  await readPackageJSON()
  await mkdir(OPTS.outDir)
}

const depRequireString =
  name => `window.__flintPackages["${name}"] = require("${name}");`

// read package json and write to .flint/deps/packages.js
export function bundle() {
  log('npm: bundle')
  return new Promise(async (res, rej) => {
    const file = await readFile(OPTS.packageJSON)
    const deps = Object.keys(JSON.parse(file).dependencies)
    const depNames = deps.filter(p => ['flint-js', 'react'].indexOf(p) < 0)
    const requireString = depNames.map(depRequireString).join(newLine)

    log('npm: bundle: write deps')
    await writeFile(requireString, OPTS.entry)
    await pack()

    logInstalled(deps)
    res()
  })
}

async function pack(file, out) {
  log('npm: pack')
  return new Promise((res, rej) => {
    webpack({
      entry: OPTS.entry,
      externals: { react: 'React', bluebird: '_bluebird' },
      output: { filename: OPTS.outFile }
    }, err => {
      if (err) return rej(err)
      res()
    })
  })
}

const findRequires = source => getMatches(source, /require\(\s*['"]([^\'\"]+)['"]\s*\)/g, 1) || []

// scan a file and install new deps
// then update cache
export function scanFile(file, source, opts) {
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
    }

    installNext()
  }
  catch (e) {
    console.log('Error installing dependency!')
    console.log(e)
    console.log(e.message)
  }
}

export function readPackageJSON() {
  log('readPackageJSON')
  return readFile(OPTS.dir + '/package.json')
    .then(data => {
      const deps = Object.keys(JSON.parse(data).dependencies)
      log('readPackageJSON:', deps)
      cache.setInPackage(deps)
      return deps
    })
}

// npm install --save 'name'
export function save(name) {
  log('npm: save:', name)
  return new Promise((res, rej) => {
    exec('npm install --save ' + name, OPTS.dir, err => {
      if (err) rej('Install failed for package ' + name)
      else res(name)
    })
  })
}

// npm install
export function install(dir) {
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
  init, bundle, save, install, readPackageJSON, scanFile
}