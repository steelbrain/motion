var _ = require('lodash')

require("shelljs/global")

var ex = function(cmd) {
  var result = exec(cmd, { silent: true })
  if (result.code != 0) {
    console.log('error', result.output)
    process.exit()
  }
  return result.output
}

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
  return _.uniq(paths.filter(x => x.indexOf(parent) == 0)).map(x => x.split('/')[1])
}

var packages = filterByName(changedFiles, 'packages')
var apps = filterByName(changedFiles, 'apps')
var all = [].concat(apps, packages)

// something to update
if (!all.length) {
  console.log('Nothing updated since last publish!')
  process.exit()
}

// ensure they are all shrinkwrappable before trying to release
packages.forEach(pkg => cd('packages/' + pkg) && ex('npm shrinkwrap'))
apps.forEach(pkg => cd('apps/' + pkg + '/.flint') && ex('npm shrinkwrap'))

var releaseOrder = [
  'nice-styles',
  'transform',
  'flint.js',
  'tools',
  'flint-runner',
  'cli'
]

// right order for release
var toRelease =  _.sortBy(changedProjects.map(x => ({ project: x, index: releaseOrder.indexOf(x) })), 'index')
  .map(x => x.project)
  .filter(x => x !== 'cli')

toRelease = toRelease.concat('cli')

console.log("\n", 'Releasing (in order):', toRelease.join(", "), '...', "\n")

toRelease.forEach(project => {
  var cmd = './scripts/release.sh ' + project + ' --patch'
  console.log("Releasing...", cmd)

  var result = ex(cmd)
})

console.log("\n", 'Pushing...')
ex("git commit -am 'publish' --quiet")
ex("git push origin head --quiet")

console.log("\n", 'All done!', "\n")