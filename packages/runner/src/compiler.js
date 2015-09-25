import handleError from './lib/handleError'
import addPackage from './npm/addPackage'
import gutil from 'gulp-util'
import through from 'through2'
// import flow from 'gulp-flowtype'

let views = [];
let VIEW_LOCATIONS = {};
let emit;

const id = x => x
const props = id('view.props.')
const viewMatcher = /view ([\.A-Za-z_0-9]*)\s*(\([a-zA-Z0-9,\{\}\:\; ]+\))?\s*\{/g
const viewEnd = '})'
const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1)
const getWrapper = view => 'Flint.' + capitalize(view) + 'Wrapper'
const viewTemplates = {}
const addFlow = src => '/* @flow */ declare var Flint: any; declare var _require:any; ' + src
const jsxEnd = view => `  return () => {
    return (
      <${getWrapper(view)} view={view}>
        ${viewTemplates[view].join('\n')}
      </${getWrapper(view)}>
    )
  }
})`

// track app deps
let deps, depDir;

var Parser = {
  post: function(file, source, opts) {
    // source = addFlow(source)

    // TODO: fix this in babel
    source = source.replace('view.update(); view.update();', 'view.update();');

    // NPM
    if (!deps) {
      depDir = opts.dir;
      var packageInfo = require(opts.dir + '/package.json');

      if (packageInfo && typeof packageInfo.dependencies == 'object') {
        deps = Object.keys(packageInfo.dependencies);
      }
    }

    const requires = getMatches(source, /require\(['"]([^']+)['"]\)/g, 1) || []

    if (deps && requires) {
      const newDeps = requires.filter(x => deps.indexOf(x) < 0)

      if (newDeps.length) {
        console.log('new deps', newDeps)
        newDeps.forEach(function(name) {
          if (opts.onPackageStart)
            opts.onPackageStart(name);

          addPackage(depDir, name, handleError(function() {
            deps = deps.concat(name);

            console.log('added package to package.json', name);

            if (opts.onPackage)
              opts.onPackage(name);
          }))
        })
      }
    }

    //flow.check()
    return { file: source }
  },

  pre: function(file, source) {
    let currentView = { name: null, contents: [] }
    let inStyle = false
    let inJSX = false
    let inView = false
    let viewLines = [];

    VIEW_LOCATIONS[file] = {
      locations: [],
      views: {}
    };

    // style setter ($x = {}), then getter ($x)
    const replaceStyles = line => line
      .replace(/^\s*\$([a-zA-Z0-9\.\-\_]*)\s*\=/, 'view.style["style$1"] = (_index) => false || ')
      .replace(/\$([a-zA-Z0-9\.\-\_]+)/g, 'view.style["style$1"]')

    const transformedSource = source
      .replace(/observe\([\@\^]([a-z]*)/g, "Flint.observe(_view.entityId, '$1'")
      .replace(/\^/g, props)
      .split("\n")
      .map(function(line, index) {
        if (line.charAt(0) == "\t")
          console.log("Flint uses spaces over tabs")

        var result = line
        var view = result.match(viewMatcher);
        if (view && view.length) {
          inView = true;
          currentView.name = result.split(" ")[1];

          // set line of view start based on name
          VIEW_LOCATIONS[file].locations.push(index)
          VIEW_LOCATIONS[file].views[index] = currentView.name;
        }

        // enter jsx
        var hasJSX = line.trim().charAt(0) == "<";
        if (inView && !inJSX && hasJSX) {
          inJSX = true;
          viewTemplates[currentView.name] = []
          result = line.trim();
        }

        // if third character is actually code, leave jsx
        const jsxThirdChars = ['}', ' ', '<', '']
        var shouldLeaveJSX = line.charAt(0) == '}' || (jsxThirdChars.indexOf(line.charAt(2)) == -1)
        var leavingJSX = inJSX && shouldLeaveJSX
        if (leavingJSX) {
          inJSX = false
        }

        // in view (ONLY JSX)
        if (inJSX) {
          result = result
            .replace(/\sclass=([\"\{\'])/g, ' className=$1')
            .replace(/sync[\s]*=[\s]*{([^}]*)}/g, replaceSync)

          viewTemplates[currentView.name].push(result)
        }
        // in view (NOT JSX)
        else {
          result = replaceStyles(result)
        }

        // in view (ALL)
        if (inView) {
          currentView.contents.push(result);
        }

        // end view
        if (inView && line.charAt(0) == "}") {
          if (result.trim() == '}')
            result = viewEnd;
          else
            result += ' ' + viewEnd;
          inJSX = false;
          inView = false;
          views[currentView.name] = currentView;
          result = jsxEnd(currentView.name)
          currentView = { name: null, contents: [] }
        }

        // dont render jsx
        if (inJSX) return ''
        return result;
      }).join("\n")
      .replace(viewMatcher, viewReplacer)

    // console.log("final source", transformedSource)
    return {
      file: transformedSource,
      views: viewLines
    };
  }
}

function compile(type, opts) {
  return through.obj(function(file, enc, cb) {
    if (file.isNull()) {
      cb(null, file);
      return;
    }

    if (file.isStream()) {
      cb(new gutil.PluginError('gulp-babel', 'Streaming not supported'));
      return;
    }

    try {
      var res = Parser[type](file.path, file.contents.toString(), opts);
      file.contents = new Buffer(res.file);

      // pass view locations
      if (opts.setViewLocations)
        opts.setViewLocations(VIEW_LOCATIONS)

      this.push(file);
    } catch (err) {
      this.emit('error', new gutil.PluginError('gulp-babel', err, {fileName: file.path, showProperties: false}));
    }

    cb();
  })
}

const replaceSync = (match, inner) =>
  ['value = {', inner, '} onChange = {(e) => {', inner, ' = e.target.value;}}'].join('')

const storeReplacer = (match, name) =>
  ['_stores.', name, ' = function _flintStore() { '].join('')

const makeHash = (str) =>
  str.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)

const viewReplacer = (match, name, params) => {
  const hash = makeHash(views[name] ? views[name].contents.join("") : ''+Math.random())
  return viewOpen(name, hash, params);
}

const viewOpen = (name, hash, params) =>
  'Flint.view("' + name + '", "' + hash + '", (view, on) => {'

const getMatches = (string, regex, index) => {
  index || (index = 1); // default to the first capturing group
  var matches = [];
  var match;
  while (match = regex.exec(string)) {
    matches.push(match[index]);
  }
  return matches;
}

module.exports = compile;
