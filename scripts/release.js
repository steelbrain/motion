var _ = require('lodash')
require("shelljs/global")

function ex(cmd) {
  var result = exec(cmd, { silent: true })
  if (result.code != 0) {
    console.log('error', result.output)
    process.exit()
  }
  return result.output
}

var lastArg = process.argv[process.argv.length - 1]

var apps = []
var packages = []

if (lastArg.indexOf('--') == -1) {
  console.log("Just releasing", lastArg)

  // release one
  if (lastArg == 'tools')
    apps.push('tools')
  else
    packages.push(lastArg)
}

// auto release
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

  packages = filterByName(changedFiles, 'packages')
  apps = filterByName(changedFiles, 'apps')

  // remove cli as we transition
  packages = packages.filter(p => p != 'cli' && p != 'flint-runner')
}

var all = [].concat(apps, packages)

// release
if (!all.length) {
  console.log('Nothing updated since last publish!')
  process.exit()
}

// ensure prune/shrinkwrap
function checkAlright(path) {
  console.log('checking if shrinkwrappable: ' + path)
  var cwd = pwd()
  cd(path)
  ex('npm prune')
  ex('npm shrinkwrap --dev')
  cd(cwd)
}

// ensure they are all shrinkwrappable before trying to release
packages.forEach(pkg => checkAlright('packages/' + pkg))
apps.forEach(pkg => checkAlright('apps/' + pkg + '/.flint'))

// determines chain of release
var releaseOrder = [
  'nice-styles',
  'transform',
  'flint.js',
  'tools',
  'flint',
]

var sortedRelease = _.sortBy(all, x => releaseOrder.indexOf(x))

console.log("\n", 'Releasing (in order):', sortedRelease.join(", "), '...', "\n")

// release
sortedRelease.forEach(project => {
  var cmd = './scripts/release.sh ' + project + ' --patch'
  console.log("Releasing...", cmd)

  var result = ex(cmd)
})

console.log("\n", 'Pushing...')
ex("git commit -am 'publish' --quiet")
ex("git push origin head --quiet")

console.log("\n", 'All done!', "\n")