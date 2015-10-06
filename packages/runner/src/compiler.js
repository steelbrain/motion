import handleError from './lib/handleError'
import npm from './lib/npm'
import gutil from 'gulp-util'
import through from 'through2'
import fs from 'fs'
// import flow from 'gulp-flowtype'

let views = []
let VIEW_LOCATIONS = {}
let emit
let OPTS

const isNotIn = (x,y) => x.indexOf(y) == -1
const id = x => x
const props = id('view.props.')
const viewMatcher = /view ([\.A-Za-z_0-9]*)\s*(\([a-zA-Z0-9,\{\}\:\; ]+\))?\s*\{/g
const viewEnd = '})'
const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1)
const getWrapper = view => 'Flint.' + capitalize(view) + 'Wrapper'
const viewTemplates = {}
const addFlow = src => '/* @flow */ declare var Flint: any; declare var _require:any; ' + src
const jsxEnd = view => `
  return () =>
    <${getWrapper(view)} view={view}>
      ${viewTemplates[view].join('\n')}
    </${getWrapper(view)}>
})`

// allow style syntax
const replaceStyles = line => line
  .replace(/^\s*\$([a-zA-Z0-9\.\-\_]*)\s*\=/, 'view.styles["__STYLE__$1"] = (_index) => false || ')
  .replace(/\$([a-zA-Z0-9\.\-\_]+)/g, 'view.styles["__STYLE__$1"]')
  .replace('__STYLE__', '$')

const shortFile = file => file.replace(OPTS.dir.replace('.flint', ''), '')
const filePrefix = file => `!function() { return Flint.file('${shortFile(file)}', function(exports) {`
const fileSuffix = ';return exports }) }()'

const readPackageJsonDeps = (dir, cb) => {
  try {
    fs.readFile(dir + '/package.json', handleError(data => {
      cb(Object.keys(JSON.parse(data).dependencies))
    }))
  }
  catch(e) {
    console.log('Error reading app package.json')
    console.log(e)
  }
}

// deps cache
let installing = false
let newDeps = []
let installedDeps = []

const checkDependencies = (source, { dir, onPackageStart, onPackageFinish, onPackageError }) => {
  try {
    const found = getMatches(source, /require\(\s*['"]([^\'\"]+)['"]\s*\)/g, 1) || []
    const fresh = found.filter(x => installedDeps.indexOf(x) < 0)
    // console.log('Found packages in file:', found)
    // console.log('New packages in file:', fresh)

    // no new ones found
    if (!fresh.length) return

    // add new ones to queue
    newDeps = newDeps.concat(fresh)

    // console.log('newdeps', newDeps, installing)

    // we've queued and may already be installing, hold off
    if (installing) return

    // install deps one by one
    const installNextDep = () => {
      const dep = newDeps.shift()
      // console.log('new dep is', dep)

      onPackageStart(dep)
      npm.save(dep, dir)
      .then(() => {
        log('package installed', dep)
        installedDeps.push(dep)
        onPackageFinish(dep)
        next()
      })
      .catch(err => {
        onPackageError(err)
        next()
      })
    }

    // continue installing
    const next = () => {
      if (newDeps.length)
        installNextDep()
      else
        installing = false
    }

    installing = true
    installNextDep()
  }
  catch (e) {
    console.log('Error installing dependencies!')
    console.log(e)
  }
}

var Parser = {
  init(opts) {
    OPTS = opts || {}
    // set initial local cache of installedDeps
    readPackageJsonDeps(opts.dir, installed => {
      installedDeps = installed
      opts.after()
    })
  },

  post(file, source, opts) {
    OPTS = opts || {}
    source = filePrefix(file) + source + fileSuffix
    source = source
      .replace('["default"]', '.default')
      .replace('"use strict";', "\"use strict\";\n")

    checkDependencies(source, opts)

    // source = addFlow(source)
    //flow.check()
    return { file: source }
  },

  pre(file, source) {
    let currentView = { name: null, contents: [] }
    let inJSX = false
    let inView = false
    let viewLines = [];

    VIEW_LOCATIONS[file] = {
      locations: [],
      views: {}
    }

    const transformedSource = source
      .replace(/observe\([\@\^]([a-z]*)/g, "Flint.observe(_view.entityId, '$1'")
      .replace(/\^/g, props)
      .replace(/\+\+/g, '+= 1')
      .replace(/\-\-/g, '-= 1')
      .split("\n")
      .map((line, index) => {
        if (line.charAt(0) == "\t")
          console.log('Flint uses spaces over tabs')

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
        const shouldLeaveJSX = (
          line.charAt(0) == '}' ||
          isNotIn(['}', ' ', '<', '', ']', '/'], line.charAt(2))
        )
        const leavingJSX = inJSX && shouldLeaveJSX

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
        if (inJSX) return null
        return result;
      })
      // remove invalid lines
      .filter(l => l != null)
      .join("\n")
      .replace(viewMatcher, viewReplacer)

    // console.log("final source", transformedSource)
    return {
      file: transformedSource,
      views: viewLines
    };
  }
}

function compile(type, opts = {}) {
  if (type == 'init')
    return Parser.init(opts)

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

function log(...args) {
  if (OPTS.debug || OPTS.verbose) console.log(...args)
}

module.exports = compile;