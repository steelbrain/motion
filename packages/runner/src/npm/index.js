import { Promise } from 'bluebird'
import fs from 'fs'
import webpack from 'webpack'

import cache from '../cache'
import exec from '../lib/exec'
import log from '../lib/log'
import { p, mkdir, readFile } from '../lib/fns'

let opts

export async function init(_opts) {
  opts = _opts
  opts.outDir = p(opts.dir, 'deps')
  opts.entry = p(opts.outDir, 'deps.js')
  opts.outFile = p(opts.outDir, 'packages.js')
  log('npm: init opts: ', opts)
  await readDeps()
}

// read package json and write to .flint/deps/packages.js
export function bundle() {
  const run = async () => {
    console.log("Installing npm packages...\n".bold.blue)

    const file = await readFile(p(opts.dir, 'package.json'))
    const deps = Object.keys(JSON.parse(file).dependencies)
      .filter(p => ['flint-js', 'react'].indexOf(p) < 0)
    const requireString = deps
      .map(name => `window.__flintPackages["${name}"] = require("${name}");`)
      .join(newLine) || ''

    // make dep dir
    await pack()
    logInstalled(deps)
  }

  return new Promise(async (res, rej) => {
    await run()
    res()
  })
}

function ensurePackagesDir(file, contents) {
  return new Promise(async (res, rej) => {
    await mkdir(opts.outDir)
    res()
  })
}

async function pack(file, out) {
  await ensurePackagesDir()
  return new Promise((res, rej) => {
    webpack({
      entry: opts.entry,
      externals: { react: 'React', bluebird: '_bluebird' },
      output: { filename: opts.outFile }
    }, err => {
      if (err) return rej(err)
      res()
    })
  })
}

// deps cache
let installing = false
let newDeps = []
let installedDeps = []

export function checkDependencies(file, source, { dir, onPackageStart, onPackageFinish, onPackageError }) {
  try {
    const all = cache.getImports()
    const found = getMatches(source, /require\(\s*['"]([^\'\"]+)['"]\s*\)/g, 1) || []

    cache.setImports(file, found)

    const fresh = found.filter(f => all.indexOf(f) < 0)

    log('Found packages in file:', found)
    log('New packages:', fresh)

    // no new ones found
    if (!fresh.length) return

    // add new ones to queue
    newDeps = newDeps.concat(fresh)

    // we've queued and may already be installing, hold off
    if (installing) return

    // install deps one by one
    const installNextDep = async () => {
      const dep = newDeps.shift()
      onPackageStart(dep)

      try {
        await save(dep, dir)
        log('package installed', dep)
        installedDeps.push(dep)
        onPackageFinish(dep)
        next()
      } catch(e) {
        onPackageError(err)
        next()
      }
    }

    // continue installing
    const next = () => {
      if (newDeps.length)
        installNextDep()
      else
        installing = false
    }

    installing = true
    installNextDep()
  }
  catch (e) {
    console.log('Error installing dependencies!')
    console.log(e)
    console.log(e.message)
  }
}

export function readDeps() {
  log('readDeps')
  return readFile(opts.dir + '/package.json')
    .then(data => {
      const deps = Object.keys(JSON.parse(data).dependencies)
      log('readDeps:', deps)
      installedDeps = deps
      return deps
    })
}

// npm install --save 'name'
export function save(name, dir) {
  return new Promise((res, rej) => {
    exec('npm install --save ' + name, dir, err => {
      if (err) rej('Install failed for package ' + name)
      else res(name)
    })
  })
}

// npm view => [versions]
// import npmview from 'npmview'
export function versions(name) {
  return new Promise((res, rej) => {
    npmview(name, (err, version, info) => {
      if (err) rej(err)
      else {
        let versions = info.versions.reverse().slice(10)
        const total = versions.length

        if (!total) return res(null)

        // get detailed info for last three
        Promise.all(
          versions.slice(3).map(v => new Promise((res, rej) =>
            npmview(`${name}@${v}`, (err, v, { description, homepage }) => {
              if (err) return rej(err)
              res({ description, homepage })
            })
          ))
        ).then(infos => {
          // add info onto versions
          versions = versions
            .map((v, i) => ({ version: v, ...(infos[i] || {}) }))

          res(versions)
        })
      }
    })
  })
}

// npm install
export function install(dir) {
  return new Promise((res, rej) => {
    exec('npm install', dir || opts.dir, err => {
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
  init, bundle, save, versions, install, readDeps, checkDependencies
}