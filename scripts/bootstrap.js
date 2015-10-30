require("shelljs/global");

var path = require("path");
var fs   = require("fs");

exec("npm install --loglevel=error")

// get packages
var packages = [];

// order important so they are linkable to each other
var packageNames = ['transform', 'flint.js', 'runner', 'cli'];

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
    links: Object.keys(pkg.dependencies)
      .filter(function(package) {
        return package.indexOf('flint-') === 0
      })
  });
});

// link in apps first
['tools'].forEach(function(app) {
  cd("apps/" + app + "/.flint")
  exec("npm install --loglevel=error")
  exec("npm link")
  cd("../../..")
})

// create links
packages.forEach(function (pkg) {
  console.log(pkg.name);

  var nodeModulesLoc = "packages/" + pkg.folder + "/node_modules";
  mkdir("-p", nodeModulesLoc);

  // link them out
  packages.forEach(function (sub) {
    if (!pkg.pkg.dependencies || !pkg.pkg.dependencies[sub.name]) return;

    if (!fs.existsSync(nodeModulesLoc + "/" + sub.name)) {
      console.log("Linking", "packages/" + sub.folder, "to", nodeModulesLoc + "/" + sub.name);
      ln("-s", "packages/" + sub.folder, nodeModulesLoc + "/" + sub.name);
    }
  });

  cd("packages/" + pkg.folder)
  exec("npm install --loglevel=error")

  // link them in
  pkg.links.forEach(function(link) {
    console.log('LINKING IN ', link)
    exec("npm link " + link)
  })

  exec("npm link")

  cd("../..");
});

console.log("Done bootstrapping!")
