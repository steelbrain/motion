require("shelljs/global");

var path = require("path");
var fs   = require("fs");

cd('vendor/babel/packages/babel');
exec('npm link')
cd('../../../..')

cd('vendor/react-tools')
exec('npm link')
cd('../..')

// get packages
var packages = [];

// order important so they are linkable to each other
var packageNames = ['flint.js', 'runner', 'cli'];

packageNames.forEach(function (loc) {
  var name = path.basename(loc);
  if (name[0] === ".") return;

  var pkgLoc = __dirname + "/../packages/" + name + "/package.json";
  if (!fs.existsSync(pkgLoc)) return;

  var pkg = require(pkgLoc);
  packages.push({
    folder: name,
    links: Object.keys(pkg.dependencies)
      .filter(function(package) {
        return package.indexOf('flint-') === 0
      })
  });
});

['tools'].forEach(function(app) {
  cd("apps/" + app + "/.flint")
  exec("npm link")
  cd("../../..")
})

packages.forEach(function (pkg) {
  cd("packages/" + pkg.folder)
  exec("npm link")
  cd("../..");
});

packages.forEach(function(pkg) {
  cd("packages/" + pkg.folder)
  pkg.links.forEach(function(link) {
    console.log('LINKING IN ', link)
    exec("npm link " + link)
  })
  cd("../..");
});