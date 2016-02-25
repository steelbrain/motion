import colors from 'colors'
import fs from 'fs-extra'
import path from 'path'
import replace from 'replace'
import fetch from 'node-fetch'
import { Spinner } from '../../shared/console'
import randomColor from './colors'

const p = path.join

export default function run({ name, use, nocache, debug, init }) {
  try {
  // scaffolds as second argument
  // motion new app from/repo
  const scaffoldRepo = 'scaffold'
  let org = 'motion'
  let repo = scaffoldRepo

  // scaffold
  if (use) {
    // third party scaffold
    if (use.indexOf('/') >= 0) {
      org = use.split('/')[0]
      repo = use.split('/')[1]
    }
    // official motion scaffold
    else {
      repo = `scaffold-${use}`
    }
  }

  // test for weird names
  if (/[^a-zA-Z0-9\_\-\$\.]/g.test(name)) {
    console.error('Name can\'t contain special characters'.bold.red)
    process.exit(1)
  }

  var spinner
  let MOTION = {}
  MOTION.scaffoldDir = p(getUserHome(), '.motion', 'scaffold')
  MOTION.scaffoldRepo = `git://github.com/${org}/${repo}`
  MOTION.scaffoldSHA = p(getUserHome(), '.motion', 'scaffoldSHA')

  MOTION.dest = init
    ? process.cwd()
    : p(process.cwd(), name)

  if (!init && fs.existsSync(MOTION.dest)) {
    console.log("Error! Directory %s already exists\n".red, MOTION.dest)
  }
  else {
    console.log()
    spinner = new Spinner(`${init ? 'Initializing' : 'Creating'} app...  `)
    spinner.start()

    if (init)
      init()
    else
      create()
  }

  function init() {
    copyMotionFolder()
      .then(finish)
      .then(() => {
        spinner.stop()
      })
  }

  function create() {
    makeFolder()
      .then(nocache ? cloneDirectly : getScaffold)
      .then(initGit)
      .then(replaceGivenNameInApp)
      // .then(npmInstall)
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
      log('makeFolder', MOTION.dest)
      fs.mkdirs(MOTION.scaffoldDir, function(err) {
        fs.mkdirs(MOTION.dest, function(err) {
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

      var next =  fs.mkdirs.bind(null, MOTION.scaffoldDir, err => {
        log('fs.mkdirs err', err)
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
    log('Looking for updated scaffold in %s', MOTION.scaffoldRepo)

    return new Promise(function(resolve, reject) {
      checkNewScaffold(needsNew => {
        log('checkNewScaffold needsNew?', needsNew)
        if (!needsNew) return resolve(true)

        // remove old scaffold
        fs.remove(MOTION.scaffoldDir, function(err) {
          log('fs.remove err?', err)
          if (err) return resolve(false)

          // clone new scaffold
          promiseProcess(gitClone(MOTION.scaffoldDir), { msg: false })
            .then(() => copyLatestSHA(MOTION.scaffoldDir))
            .then(() => deleteGitFolder(MOTION.scaffoldDir))
            .then(() => resolve(true))
        })
      })
    })
  }

  function checkNewScaffold(cb) {
    log('Check for new scaffold SHA in...', MOTION.scaffoldSHA)
    fs.readFile(MOTION.scaffoldSHA, function(err, data) {
      if (err) {
        log('Error reading scaffold file')
        return cb(true)
      }

      var local = data.toString().trim()
      log('Got ', local)

      fetch('https://api.github.com/repos/motionjs/scaffold/commits')
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
        .catch(err => {
          cb(true)
        })
    })
  }

  function deleteGitFolder(dir) {
    return new Promise(function(resolve, reject) {
      log('Remove .git folder')
      // delete git dir
      fs.remove(p(dir, '/.git'), function(err) {
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
      log('Copy new SHA', head, MOTION.scaffoldSHA)

      try {
        var sha = fs.readFileSync(head)
        fs.writeFileSync(MOTION.scaffoldSHA, sha)
        res()
      }
      catch(e) {
        log('error with copyLatestSHA', e.stack)
        rej()
      }
    })
  }

  function copyScaffold() {
    log('Copy new scaffold', MOTION.scaffoldDir, MOTION.dest)
    return new Promise((res, rej) => {
      fs.copy(MOTION.scaffoldDir, MOTION.dest, function(err) {
        if (err) {
          console.log("Error, couldn't copy scaffold folder".red)
          console.log(MOTION.scaffoldDir, MOTION.dest)
          process.exit(1)
        }

        res()
      })
    })
  }

  function copyMotionFolder() {
    log('Copy motion folder', MOTION.scaffoldDir, MOTION.dest)
    return new Promise((res, rej) => {
      const src = p(MOTION.scaffoldDir, '.motion')
      const dest = (MOTION.dest, '.motion')

      fs.copy(src, dest, function(err) {
        if (err) {
          console.log("Error, couldn't copy motion folder".red)
          console.log(src, dest)
          process.exit(1)
        }

        res()
      })
    })
  }

  function gitClone(dest) {
    return 'git clone --depth=1 ' + MOTION.scaffoldRepo + ' ' + dest
  }

  // clone right into target new folder
  function cloneDirectly() {
    log('Cloning directly', gitClone(MOTION.dest))
    return promiseProcess(gitClone(MOTION.dest), { msg: false })
      .then(() => deleteGitFolder(MOTION.dest))
  }

  function initGit() {
    log('Init new git')
    return promiseProcess('git init', { msg: false })
  }

  function replaceGivenNameInApp() {
    message('Setting app name...')
    return new Promise(function(resolve, reject) {
      log('Updating app name to', name, 'in', MOTION.dest)
      replace({
        regex: 'motion-scaffold',
        replacement: name,
        paths: [MOTION.dest],
        recursive: true,
        silent: true
      })

      // random color :)
      replace({
        regex: 'lightsalmon',
        replacement: randomColor(),
        paths: [p(MOTION.dest, 'main.js')],
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
      dir: MOTION.dest + '/.motion'
    })
  }

  const exec = require('child_process').exec

  function promiseProcess(cmd, opts) {
    opts = opts || {}

    if (opts.msg !== false)
      message(opts.msg || cmd)

    return new Promise(function(resolve, reject) {
      process.chdir(opts.appDir || MOTION.dest)
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

    if (init)
      console.log(`  Created .motion folder, ready to run motion\n`)
    else
      console.log('  Done! ⇢'.green.bold, ` cd ${name}\n`)

    process.exit()
  }

  function message(str) {
    spinner.message(str)
  }

  function log(...args) {
    if (debug)
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

  function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  }

  } catch(e) {
    console.log(e.stack)
  }
}