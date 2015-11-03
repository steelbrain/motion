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
import fetch from 'node-fetch'
import raven from 'raven'

import { Spinner } from '../ui'
import randomColor from '../colors'

const errorClient = new raven.Client('https://196a18bffe5f4859bb48bbdbef4d6375:d92602c84a694bd6ab31ef3051fe8bd5@app.getsentry.com/55034')

try {

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

// test for weird names
if (/[^a-zA-Z0-9\_\-\$\.]/g.test(name)) {
  console.error('Name can\'t contain special characters'.bold.red)
  process.exit(1)
}

var spinner, fps = 60
let FLINT = {}
FLINT.dir = __dirname
FLINT.scaffoldDir = p(getUserHome(), '/.flint/scaffold')
FLINT.scaffoldRepo = `https://github.com/${org}/${repo}`
FLINT.scaffoldSHA = p(getUserHome(), '/.flint/scaffoldSHA')
FLINT.dest = process.cwd() + '/' + name

if (fs.existsSync(FLINT.dest)) {
  console.log("Error! Directory %s already exists\n".red, FLINT.dest)
}
else {
  console.log()
  spinner = new Spinner('Creating app...  ')
  spinner.start({ fps })
  start()
}

function start() {
  makeFolder()
    .then(Program.nocache ? cloneDirectly : getScaffold)
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
    mkdirp(FLINT.scaffoldDir, function(err) {
      mkdirp(FLINT.dest, function(err) {
        if (err) reject(err)
        else resolve()
      })
    })
  })
}

function getScaffold() {
  return new Promise((res, rej) => {
    // check online
    promiseProcess('curl http://github.com', { msg: false })
      .then(() => {
        log('Online')
        next()
      })
      .catch(() => {
        log('Not online')
        copyScaffold().then(() => res())
      })

    var next =  mkdirp.bind(null, FLINT.scaffoldDir, err => {
      log('mkdirp err', err)
      const isCloningExample = repo != scaffoldRepo

      if (err || isCloningExample)
        return cloneDirectly()
          .then(() => res())

      return updateScaffoldCache()
        .catch(cloneDirectly)
        .then(doCopy => {
          log('doCopy?', doCopy)
          if (doCopy)
            return copyScaffold()
          else
            return cloneDirectly()
        })
        .then(() => {
          // continue
          log('CONTINUE FROM getScaffold')
          res()
        })
    })
  })
}

function updateScaffoldCache() {
  log('Looking for updated scaffold in %s', FLINT.scaffoldRepo)

  return new Promise(function(resolve, reject) {
    return checkNewScaffold(needsNew => {
      log('checkNewScaffold needsNew?', needsNew)
      if (!needsNew) return resolve(true)

      // remove old scaffold
      rimraf(FLINT.scaffoldDir, function(err) {
        log('rimraf err?', err)
        if (err) return resolve(false)

        // clone new scaffold
        promiseProcess(gitClone(FLINT.scaffoldDir), { msg: false })
          .then(() => copyLatestSHA(FLINT.scaffoldDir))
          .then(() => deleteGitFolder(FLINT.scaffoldDir))
          .then(() => resolve(true))
      })
    })
  })
}

function checkNewScaffold(cb) {
  log('Check for new scaffold SHA in...', FLINT.scaffoldSHA)
  fs.readFile(FLINT.scaffoldSHA, function(err, data) {
    if (err) {
      log('Error reading scaffold file')
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
  return new Promise(function(resolve, reject) {
    log('Remove .git folder')
    // delete git dir
    rimraf(p(dir, '/.git'), function(err) {
      log('after remove .git err?:', err)
      if (err) return reject(err)
      resolve()
    })
  })
}

function copyLatestSHA(dir) {
  return new Promise(function(res, rej) {
    log('copyLatestSHA')
    // copy latest SHA into folder
    var head = p(dir, '.git', 'refs', 'heads', 'master')
    log('Copy new SHA', head, FLINT.scaffoldSHA)

    try {
      var sha = fs.readFileSync(head)
      fs.writeFileSync(FLINT.scaffoldSHA, sha)
      res()
    }
    catch(e) {
      log('error with copyLatestSHA', e.stack)
      rej()
    }
  })
}

function copyScaffold() {
  log('Copy new scaffold', FLINT.scaffoldDir, FLINT.dest)
  return new Promise((res, rej) => {
    ncp(FLINT.scaffoldDir, FLINT.dest, function(err) {
      if (err) {
        console.log("Error, couldn't copy scaffold folder".red)
        console.log(FLINT.scaffoldDir, FLINT.dest)
        process.exit(1)
      }

      res()
    })
  })
}

function gitClone(dest) {
  return 'git clone --depth=1 ' + FLINT.scaffoldRepo + ' '+ dest
}

// clone right into target new folder
function cloneDirectly() {
  log('Cloning directly', gitClone(FLINT.dest))
  return promiseProcess(gitClone(FLINT.dest), { msg: false })
    .then(() => deleteGitFolder(FLINT.dest))
}

function initGit() {
  log('Init new git')
  return promiseProcess('git init', { msg: false })
}

function replaceGivenNameInApp() {
  message('Setting app name...')
  return new Promise(function(resolve, reject) {
    log('Updating app name to', name, 'in', FLINT.dest)
    replace({
      regex: 'flint-scaffold',
      replacement: name,
      paths: [FLINT.dest],
      recursive: true,
      silent: true
    })

    // random color :)
    replace({
      regex: 'lightsalmon',
      replacement: randomColor(),
      paths: [p(FLINT.dest, 'main.js')],
      recursive: false,
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


const exec = require('child_process').exec

function promiseProcess(cmd, opts) {
  opts = opts || {}

  if (opts.msg !== false)
    message(opts.msg || cmd)

  return new Promise(function(resolve, reject) {
    process.chdir(opts.dir || FLINT.dest)
    log(' $ ', cmd)
    exec(cmd, { uid: process.getuid() }, (...args) => {
      handleChildProcess(resolve, reject, ...args)
    })
  })
}

function handleChildProcess(resolve, reject, error, stdout, stderr) {
  if (error) {
    log(stderr)
    return reject(error)
  }

  log(stdout)
  resolve()
}

function finish() {
  message('Done!')
  spinner.stop()

  wait().then(function() {
    console.log('Your Flint app is in ./%s'.green.bold, name)
    console.log()
    process.exit()
  })
}

function message(str) {
  spinner.message(str)
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

// mask (1 = execute, 4 = read, 2 = write)
function checkPermission(file, mask, cb){
  fs.stat(file, function (error, stats){
    if (error){
      cb (error, false);
    }else{
      cb (null, !!(mask & parseInt ((stats.mode & parseInt ("777", 8)).toString (8)[0])));
    }
  });
};


} catch(e) {
  console.log(e.stack)
  errorClient.captureException(e)
}

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}