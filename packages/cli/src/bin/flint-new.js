#!/usr/bin/env node

import Program from 'commander'
import { Promise } from 'es6-promise'
import colors from 'colors'
import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import replace from 'replace'
import mkdirp from 'mkdirp'
import ncp from 'ncp'
import { Spinner } from '../ui'
import fetch from 'node-fetch'

const p = path.join

Program
  .option('-n, --nocache', 'dont use local cache of latest flint scaffold')
  .option('-d, --debug', 'output extra information for debugging')
  .option('-u, --use [scaffold]', 'start with a scaffold')
  .parse(process.argv)

const args = Program.args

if (!args.length) {
  console.log('Must give a name (flint new myname)'.red)
  process.exit(1)
}

// scaffolds as second argument
// flint new app from/repo
const where = Program.use || args[1]
const scaffoldRepo = 'scaffold'
let org = 'flintjs'
let repo = scaffoldRepo

// scaffold
if (where) {
  // third party scaffold
  if (where.indexOf('/') >= 0) {
    org = where.split('/')[0]
    repo = where.split('/')[1]
  }
  // official flint scaffold
  else {
    repo = `scaffold-${where}`
  }
}

var name = args[0]
var spinner, fps = 60
var FLINT = {
  dir: __dirname,
  scaffoldDir: p(__dirname, 'scaffold'),
  scaffoldRepo: `https://github.com/${org}/${repo}`,
  scaffoldSHA: p(__dirname, 'scaffoldSHA'),
  dest: process.cwd() + '/' + name,
}

if (fs.existsSync(FLINT.dest)) {
  console.log("Error! Directory %s already exists\n".red, FLINT.dest)
}
else {
  spinner = new Spinner('Creating app...  ')
  spinner.start({ fps })
  start()
}

function start() {
  makeFolder()
    .then(Program.nocache ? cloneDirectly : getScaffold)
    .then(wait)
    .then(initGit)
    .then(replaceGivenNameInApp)
    .then(finish)
    .then(() => {
      spinner.stop()
    })
    .catch(function(err) {
      spinner.stop()
      console.log("\n", 'Error'.bold.red)
      console.log(err)
    })
}

function makeFolder() {
  return new Promise(function(resolve, reject) {
    log('makeFolder', FLINT.dest)
    mkdirp(FLINT.dest, function(err) {
      if (err) reject(err)
      else resolve()
    })
  })
}

function getScaffold() {
  // if cloning example
  if (repo != scaffoldRepo)
    return cloneDirectly()

  return updateScaffoldCache()
    .then(copyScaffold)
    .catch(cloneDirectly)
}

function updateScaffoldCache() {
  log('Looking for updated scaffold in %s', FLINT.scaffoldRepo)

  return new Promise(function(resolve, reject) {
    // check if online
    checkNewScaffold(function(needsNew) {
      if (!needsNew)
        return resolve()

      // remove old scaffold
      rimraf(FLINT.scaffoldDir, function(err) {
        // clone new scaffold
        promiseProcess(gitClone(FLINT.scaffoldDir), { msg: false })
          .then(copyLatestSHA(FLINT.scaffoldDir))
          .then(deleteGitFolder(FLINT.scaffoldDir))
          .then(resolve)
      })
    })
  })
}

function checkNewScaffold(cb) {
  log('Check for new scaffold SHA in...', FLINT.scaffoldSHA)
  fs.readFile(FLINT.scaffoldSHA, function(err, data) {
    if (err) {
      log('Error reading scaffold file', err)
      return cb(true)
    }

    var local = data.toString().trim()
    log('Got ', local)

    fetch('https://api.github.com/repos/flintjs/scaffold/commits')
      .then(function(res) { return res.json() })
      .then(function(commits) {
        var remote = commits[0].sha.trim()
        log('Latest is', remote)

        if (local != remote) {
          message('Fetching latest scaffold...')
          // new
          cb(true)
        }
        else {
          // no new
          cb(false)
        }
      })
  })
}

function deleteGitFolder(dir) {
  return function() {
    return new Promise(function(resolve, reject) {
      log('Remove .git folder')
      // delete git dir
      rimraf(p(dir, '/.git'), function(err, data) {
        if (err) return reject(err)
        resolve(data)
      })
    })
  }
}

function copyLatestSHA(dir) {
  return new Promise(function(res, rej) {
    // copy latest SHA into folder
    var head = p(dir, '.git', 'refs', 'heads', 'master')
    log('Copy new SHA', head, FLINT.scaffoldSHA)
    ncp(head, FLINT.scaffoldSHA, function(err) {
      if (err) return rej(err)
      else res()
    })
  })
}

function copyScaffold() {
  log('Copy new scaffold', FLINT.scaffoldDir, FLINT.dest)
  return ncp(FLINT.scaffoldDir, FLINT.dest, function(err) {
    if (err) {
      console.log("Error, couldn't copy scaffold folder".red)
      console.log(FLINT.scaffoldDir, FLINT.dest)
      process.exit(1)
    }
  })
}

function gitClone(dest) {
  return 'git clone --depth=1 ' + FLINT.scaffoldRepo + ' '+ dest
}

// clone right into target new folder
function cloneDirectly() {
  log('Cloning directly', gitClone(FLINT.dest))
  return promiseProcess(gitClone(FLINT.dest), { msg: false })
    .then(deleteGitFolder(FLINT.dest))
}

function initGit() {
  log('Init new git')
  return promiseProcess('git init', { msg: false })
}

function replaceGivenNameInApp() {
  message('Setting app name...')
  return new Promise(function(resolve, reject) {
    log('Updating app name')
    replace({
      regex: 'flint-scaffold',
      replacement: name,
      paths: [FLINT.dest],
      recursive: true,
      silent: true
    })

    resolve()
  })
}

function npmInstall() {
  log('Running npm install')
  return promiseProcess('npm install', {
    msg: 'Running npm install...',
    dir: FLINT.dest + '/.flint'
  })
}

function tryLinkFlint() {
  log('Try to link local flint')
  return promiseProcess('npm link flintjs', {
    msg: false,
    dir: FLINT.dest + '/.flint'
  })
}

function promiseProcess(cmd, opts) {
  opts = opts || {}

  if (opts.msg !== false)
    message(opts.msg || cmd)

  return new Promise(function(resolve, reject) {
    process.chdir(opts.dir || FLINT.dest)
    var exec = require('child_process').exec, child
    child = exec(cmd, {
      uid: process.getuid()
    }, handleChildProcess.bind(this, resolve, reject))
  })
}

function handleChildProcess(resolve, reject, error, stdout, stderr) {
  if (error) {
    console.log('Error', error)
    log(stderr)
    return reject(error)
  }

  resolve()
}

function finish() {
  message('Done!')
  spinner.stop()

  wait().then(function() {
    console.log()
    console.log('Your new Flint app is ready in ./%s'.green.bold, name)
    console.log()
    process.exit(1)
  })
}

function message(str) {
  spinner.message(str)
  console.log()
}

function wait() {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve()
    }, fps)
  })
}

function log(...args) {
  if (Program.debug)
    console.log(...args)
}