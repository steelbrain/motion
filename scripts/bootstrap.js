require("shelljs/global")

var path = require("path")
var fs   = require("fs")

console.log("\n\HEY! LISTEN!\n")
console.log("PUT THIS IN YOUR SHELL TO GET DEBUGS:")
console.log('export FLINT_DEBUG="true"')
console.log("\n\n")

// ensure proper npm global permissions
var canWrite = true

try {
  var npmroot = exec('npm root -g').output.replace(/\s+/,'')
  var testpath = path.join(npmroot, 'test123')
  console.log('testpath', testpath)
  fs.writeFileSync(testpath)
  fs.unlinkSync(testpath)
}
catch(e) {
  canWrite = false
}

// fix if not good
if (!canWrite) {
  console.log("Need to fix your global npm permissions to be owned by user... (sudo required)")
  exec('sudo chown -R $(whoami) ~/.npm')
  exec('sudo chown -R $(whoami) $(npm root -g)')
  exec('sudo chown -R $(whoami) $(npm bin -g)')
}

// SETUP PACKAGES

// get packages
var packages = []

// order important so they are linkable to each other
var packageNames = ['transform', 'nice-styles', 'flint.js', 'flint']
var globalFolder = exec('npm root -g').output.replace("\n", '')

packageNames.forEach(function (loc) {
  var name = path.basename(loc)
  if (name[0] === ".") return

  var pkgLoc = __dirname + "/../packages/" + name + "/package.json"
  if (!fs.existsSync(pkgLoc)) return

  var pkg = require(pkgLoc)

  packages.push({
    folder: name,
    pkg: pkg,
    name: pkg.name,
    global: pkg.global,
    deps: pkg.dependencies && Object.keys(pkg.dependencies) || []
  })
})

// link in apps first
var apps = ['tools']

apps.forEach(function(app) {
  cd("apps/" + app + "/.flint")
  exec("npm install --loglevel=error")
  exec("npm link")
  cd("../../..")
})

// create links
packages.forEach(function (pkg) {
  console.log('---', pkg.name, '---')

  var pkgFolder = "packages/" + pkg.folder
  var nodeModulesLoc = pkgFolder + "/node_modules";

  // prune
  cd(pkgFolder)
  console.log('pruning...')
  exec('npm prune', { silent: true })
  exec('(cd node_modules && find . -name "flint*" -exec rm -r "{}" \\;)')
  cd('../..')

  mkdir("-p", nodeModulesLoc)

  cd("packages/" + pkg.folder)
  console.log('installing...')
  exec("npm install --loglevel=error")

  // link them in
  var links = pkg.deps.filter(function(dep) {
    // if linked into globals, lets link it in
    var depGlobalPath = path.join(globalFolder, dep).toString()

    // if starts with flint and is a link in the globals, link it in
    return (dep.indexOf('flint-') == 0 && test('-L', depGlobalPath))
  })

  console.log('linking in other flint packages...')

  links.forEach(function(link) {
    console.log(link)
    exec("npm link " + link + " --loglevel=error")
  })

  exec("npm link --loglevel=error")

  cd("../..")
})

console.log('Running prepublish scripts...')
packages.forEach(function(pkg) {
  var script = 'packages/' + pkg.folder + '/prepublish.js'
  if (test('-f', script)) {
    cd('packages/' + pkg.folder)
    console.log("Running prepublish scripts for", pkg.name)
    exec('node prepublish.js')
    cd('../..')
  }
})

console.log("Done bootstrapping!")
