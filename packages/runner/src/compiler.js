import handleError from './lib/handleError'
import addPackage from './npm/addPackage'
import gutil from 'gulp-util'
import through from 'through2'
// import flow from 'gulp-flowtype'

var views = [];
var VIEW_LOCATIONS = {};
var emit;

const id = function(c) { return c }
const props = id("__.props.")
const replaceJSXOpenTag = function(match, tagName) {
  return '<' + tagName + ' '
}

const viewMatcher = /view ([\.A-Za-z_0-9]*)\s*(\([a-zA-Z0-9,\{\}\:\; ]+\))?\s*\{/g;
const viewEnd = [
  '})',
].join('\n')

const capitalize = function(s) { return s.charAt(0).toUpperCase() + s.slice(1) }
const getWrapper = function(view) { return 'Flint.' + capitalize(view) + 'Wrapper' }

const viewTemplates = {}

const jsxEnd = function(view) {
  return [
    "return (__) => {",
    "  return (",
    '    <' + getWrapper(view) + ' view={__}>',
    '      ' + viewTemplates[view].join('\n'),
    '    </' + getWrapper(view) + '>',
    '  )',
    '}',
    '})',
  ].join('\n')
}
const styleMatcher = /\$([a-zA-Z0-9\.\-\_]+)/g;
const styleSetterMatcher = /^\s*\$([a-zA-Z0-9\.\-\_]*)\s*\=/;

const babelPostProcess = function(source) {
  //return "/* @flow */ declare var Flint: any; declare var _require:any; " + source
  return source
}

// track app deps
var deps, depDir;

var Parser = {
  post: function(file, source, opts) {
    // source = babelPostProcess(source)

    // TODO: fix this in babel
    source = source.replace('__.update(); __.update();', '__.update();');

    // restore bad Flint.data
    // source = source.replace('Flint.data(\\"\\")', '#')

    // restore bad @
    source = source.replace('_vars.media (', '@media (')

    // source = source.replace(/Flint\.data\(\'[^']+\'\)\.\s/, )

    // source = source
    //   .replace(
    //     /_vars.[^\n]+\n[^\n]+\"ARROW\" &&/g,
    //     '"flintReactive", function() { return '
    //   )

    if (!deps) {
      depDir = opts.dir;
      var packageInfo = require(opts.dir + '/package.json');

      if (packageInfo && typeof packageInfo.dependencies == 'object') {
        deps = Object.keys(packageInfo.dependencies);
      }
    }

    const requires = getMatches(source, /require\(['"]([^']+)['"]\)/g, 1) || []

    if (deps && requires) {
      const newDeps = requires.filter(function(x) {
        return deps.indexOf(x) < 0
      })

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
    var inStyle = false
    var inJSX = false
    var inView = false
    var currentView = { name: null, contents: [] }
    var viewLines = [];
    VIEW_LOCATIONS[file] = {
      locations: [],
      views: {}
    };

    var replaceStyles = function(line) {
      return line
        .replace(styleSetterMatcher, '__.style["style$1"] = (_index) => false || ')
        .replace(styleMatcher, '__.style["style$1"]')
    }

    var transformedSource = source
      .replace(/sync[\s]*=[\s]*{([^}]*)}/g, replaceSync)
      .replace(/\+\+/g, '+= 1')
      .replace(/\-\-/g, '-= 1')
      .replace(/observe\([\@\^]([a-z]*)/g, "Flint.observe(_view.entityId, '$1'")
      .replace(/([\s\;\,]+)on\(([\'\"\`])/g, '$1on(this, $2')
      .replace(/::[\s*]{/g, "= {() => ")
      .replace(/\^/g, props)
      .replace(/store ([A-Z][A-Za-z_]*)\s*\{/g, storeReplacer)
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

        if (inJSX) {
          result = result
            .replace(/\<([A-Za-z1-9\-\.]+)/g, replaceJSXOpenTag)
            .replace(/\sclass=([\"\{\'])/g, 'className=$1')

          viewTemplates[currentView.name].push(result)
        } else {
          result = replaceStyles(result)
        }

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

function replaceSync(match, inner) {
  return ['value = {', inner, '} onChange = {(e) => {', inner, ' = e.target.value;}}'].join('')
}

function storeReplacer(match, name) {
  return ['_stores.', name, ' = function _flintStore() { '].join('');
}

function makeHash(str) {
  return str.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
}

function viewReplacer(match, name, params) {
  const hash = makeHash(views[name] ? views[name].contents.join("") : ''+Math.random())
  return viewOpen(name, hash, params);
}

function viewOpen(name, hash, params) {
  //return 'declare var ' + name.replace('.', '') + ': any; Flint.defineView("' + name + '", "' + hash + '", (function '
  //+ "()" + ' {';
  return 'Flint.view("' + name + '", "' + hash + '", (__) => {'
}

function getMatches(string, regex, index) {
  index || (index = 1); // default to the first capturing group
  var matches = [];
  var match;
  while (match = regex.exec(string)) {
    matches.push(match[index]);
  }
  return matches;
}

module.exports = compile;
