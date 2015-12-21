require("shelljs/global");

var path = require("path");
var fs   = require("fs");

exec("npm install --loglevel=error")

// get packages
var packages = [];

// order important so they are linkable to each other
var packageNames = ['transform', 'nice-styles', 'flint.js', 'flint-runner', 'cli'];
var globalFolder = exec('npm root -g').output.replace("\n", '')

packageNames.forEach(function (loc) {
  var name = path.basename(loc);
  if (name[0] === ".") return;

  var pkgLoc = __dirname + "/../packages/" + name + "/package.json";
  if (!fs.existsSync(pkgLoc)) return;

  var pkg = require(pkgLoc);
  packages.push({
    folder: name,
    pkg: pkg,
    name: pkg.name,
    global: pkg.global,
    deps: pkg.dependencies && Object.keys(pkg.dependencies) || []
  });
});

// create links
packages.forEach(function (pkg) {
  console.log('---', pkg.name, '---')

  var pkgFolder = "packages/" + pkg.folder
  var nodeModulesLoc = pkgFolder + "/node_modules";

  // prune
  cd(pkgFolder)
  console.log('pruning...')
  exec('npm prune --loglevel=error')
  cd('../..')

  mkdir("-p", nodeModulesLoc);

  cd("packages/" + pkg.folder)
  console.log('installing...')
  exec("npm install --loglevel=error")

  // link them in
  var links = pkg.deps.filter(function(dep) {
    // if linked into globals, lets link it in
    var depGlobalPath = path.join(globalFolder, dep).toString()
    if (dep.indexOf('flint-') > -1 && test('-e', depGlobalPath))
      return true
  })

  console.log('linking in other flint packages...')
  links.forEach(function(link) {
    console.log(link)
    exec("npm link " + link + " --loglevel=error")
  })

  exec("npm link --loglevel=error")

  cd("../..");
});

console.log("Done bootstrapping!")
