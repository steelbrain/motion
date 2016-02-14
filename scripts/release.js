var _ = require('lodash')
var path = require('path')
var fs = require('fs')

require("shelljs/global")

//
// fns
//

const VERBOSE = process.argv.indexOf('--verbose') > 0
const PATCH = process.argv.indexOf('--patch') > 0

// safe exec
function ex(cmd) {
  if (VERBOSE) console.log('running:', cmd)

  var result = exec(cmd, { silent: true })
  if (result.code != 0) {
    console.log(cmd, 'error', result.output)
    process.exit()
  }

  if (VERBOSE) console.log(result.output)
  return result.output
}

function cdTo(where, execute) {
  var cwd = pwd()
  cd(where)
  execute(where)
  cd(cwd)
}

//
// init
//

// determines order of release
var releaseOrder = [
  'nice-styles',
  'transform',
  'motion.js',
  'tools',
  'motion',
]

var apps = []
var packages = []

var sortByReleaseOrder = ls => _.sortBy(ls, x => releaseOrder.indexOf(x))
var projectPath = n => path.join('packages', n)
var appPath = n => path.join('apps', n, '.motion')

// options
var lastArg = process.argv[process.argv.length - 1]

// release one
if (!lastArg.indexOf('release') && lastArg.indexOf('--') == -1) {
  console.log("Just releasing", lastArg)

  // release one
  if (lastArg == 'tools')
    apps.push('tools')
  else
    packages.push(lastArg)
}

// auto release, find which to release
else {
  var lastPublish = ex('git log --all --grep="publish" --max-count=1 --format=format:%H')
  var newCommits = ex('git log '+ lastPublish +'..HEAD --format=format:%H').split("\n")

  if (!newCommits.length) {
    console.log('No new commits since last publish')
    process.exit()
  }

  console.log('New commits:', newCommits.length)
  console.log('Last published:', lastPublish)

  var changedFiles = ex('git diff --name-only '+lastPublish+'..HEAD').split("\n")

  function filterByName(paths, parent) {
    return _.uniq(paths.filter(x => x.indexOf(parent) == 0).map(x => x.split('/')[1]))
  }

  packages = sortByReleaseOrder(filterByName(changedFiles, 'packages'))
  apps = sortByReleaseOrder(filterByName(changedFiles, 'apps'))
}

// always release motion & always last
if (packages.indexOf('motion') < 0)
  packages.push('motion')

// release
if (!packages.length && !apps.length) {
  console.log('Nothing updated since last publish!')
  process.exit()
}

console.log(
  "\nReleasing (in order):", apps, packages, '...', "\n"
)

var releasedVersions = {}

// release
function release(name, dir) {
  console.log("Releasing...", name)

  cdTo(dir, function() {
    // get package.json
    var info = JSON.parse(fs.readFileSync('package.json'))

    // motion
    if (name == 'motion') {
      // bundled dependencies
      info.bundledDependencies = Object.keys(info.dependencies)

      // lockdown versions
      Object.keys(releasedVersions).forEach(released => {
        console.log('locking motion to use', released, releasedVersions[released])
        info.dependencies[released] = releasedVersions[released]
      })

      fs.writeFileSync('package.json', JSON.stringify(info, null, 2))
    }

    // prepublish
    if (test('-f', 'prepublish.js')) {
      console.log('running prepublish for', name)
      ex('node prepublish.js')
    }

    // if (PATCH)
    //   ex('npm version patch')

    // console.log(ex('npm publish --tag=latest'))

    // store released versions
    releasedVersions[name] = info.version
  })
}

// do release
apps.forEach(name => release(name, appPath(name)))
packages.forEach(name => release(name, projectPath(name)))

// push it up
console.log("\n", 'Pushing...')
ex("git commit -am 'publish' --quiet")
ex("git push origin head --quiet")

console.log("\n", 'All done!', "\n")