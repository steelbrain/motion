import handleError from './lib/handleError'
import npm from './npm'
import log from './lib/log'
import cache from './cache'
import gutil from 'gulp-util'
import through from 'through2'
import fs from 'fs'

let views = []
let emit
let OPTS

const post = {
  viewStart: 'Flint.view("',
  viewEnd: '/* end view:',
  viewUpdateStart: /view.update\(/g,
  viewUpdateEnd: /\) \/\*_end_view_update_\*\//g
}

var Parser = {
  init(opts) {
    OPTS = opts || {}
    log('init')

    if (!opts.build)
      cache.setBaseDir(opts.dir)

    npm.getPackageDeps(opts.dir).then(opts.after)
  },

  post(file, source, opts) {
    OPTS = opts || {}
    npm.checkDependencies(file, source, opts)

    let inView = false

    // console.log(source)

    source = source.split("\n")
      .map(line => {
        // fix for jsx imports: <imported.default />
        let result = line
          .replace('["default"]', '.default')
          .replace("['default']", '.default')

        // detect views
        const viewStartsAt = result.indexOf(post.viewStart)
        const viewEndsAt = result.indexOf(post.viewEnd)

        if (viewStartsAt >= 0)
          inView = true
        if (inView && viewEndsAt > 0)
          inView = false

        // remove non-view updates
        if (!inView)
          result = result
            .replace(post.viewUpdateStart, '')
            .replace(post.viewUpdateEnd, '')

        // strip extra view.update comments
        result = result.replace(/\s*\/\*_end_view_update_\*\/\s*/g, '')

        return result
      })
      .join("\n")

    source = filePrefix(file) + source + fileSuffix
    return { source }
  },

  pre(file, source) {
    let currentView = { name: null, contents: [] }
    let inJSX = false
    let inView = false
    let fileViews = []

    const startRender = () => `view._render = () => { return (${startWrapper()}`
    const startWrapper = () => `<${getWrapper(currentView.name)} view={view}>`
    const endRender = () => `</${getWrapper(currentView.name)}>); }; \n`

    source = source
      .replace(/\^/g, 'view.props.')
      .replace(/\+\+/g, '+= 1')
      .replace(/\-\-/g, '-= 1')
      .split("\n")
      .map((line, index) => {
        if (line.charAt(0) == "\t")
          console.log('Flint uses spaces over tabs')

        let result = line
        let view = result.match(viewMatcher);
        if (view && view.length) {
          inView = true;
          currentView.name = result.split(' ')[1];
          // track view in file
          fileViews.push(currentView.name)
        }

        const shouldLeaveJSX = (
          inJSX && (
            line.charAt(0) == '}' ||
            isNotIn(['}', ' ', '<', '', ']', '/'], line.charAt(2))
          )
        )

        // ENTER jsx
        const hasJSX = line.trim().charAt(0) == '<'

        // if entering jsx
        if (inView && !inJSX && hasJSX) {
          inJSX = true
          result = line.trim()
          result = startRender() + result
        }

        // ONLY JSX transforms
        if (inJSX) {
          result = result
            .replace(/\sclass=([\"\{\'])/g, ' className=$1')
            .replace(/sync[\s]*=[\s]*{([^}]*)}/g, replaceSync)
        }

        // store view contents for hashing
        if (inView) {
          result = result.replace(/\$\.([A-Za-z0-9]+\s*\=)/, '$_class_$1')

          currentView.contents.push(result)
        }

        // end jsx
        if (shouldLeaveJSX) {
          result = endRender() + result
          inJSX = false
        }

        // end view
        if (inView && line.charAt(0) == '}') {
          result = result + viewEnd(currentView.name)
          inView = false
          views[currentView.name] = currentView
          currentView = { name: null, contents: [] }
        }

        return result
      })
      .join("\n")
      .replace(viewMatcher, viewReplacer)

    if (!OPTS.build) {
      cache.add(file)
      cache.setViews(file, fileViews)
    }

    // console.log('transformed source', source)
    return { source }
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
      cb(new gutil.PluginError('gulp-babel', 'Streaming not supported'))
      return
    }

    try {
      var res = Parser[type](file.path, file.contents.toString(), opts);
      file.contents = new Buffer(res.source);
      this.push(file);
    } catch (err) {
      this.emit('error', new gutil.PluginError('gulp-babel', err, {fileName: file.path, showProperties: false}));
    }

    cb();
  })
}

const isNotIn = (x,y) => x.indexOf(y) == -1

// this is missing the first brace ")" instead of "})"
// because this is being *added* to the line, which is previously }
const viewEnd = name => `); /* end view: ${name} */; \n`
const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1)
const getWrapper = view => 'Flint.' + capitalize(view) + 'Wrapper'

const shortFile = file => file.replace(OPTS.dir.replace('.flint', ''), '')
const filePrefix = file => `!function() { return Flint.file('${shortFile(file)}', function(exports) {`
const fileSuffix = ';return exports }) }();'

const replaceSync = (match, inner) =>
  ['value = {', inner, '} onChange = {(e) => {', inner, ' = e.target.value;}}'].join('')

const storeReplacer = (match, name) =>
  ['_stores.', name, ' = function _flintStore() { '].join('')

const makeHash = (str) =>
  str.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)

const viewOpen = (name, hash, params) =>
  'Flint.view("' + name + '", "' + hash + '", (view, on) => {'
const viewMatcher = /view ([\.A-Za-z_0-9]*)\s*(\([a-zA-Z0-9,\{\}\:\; ]+\))?\s*\{/g
const viewReplacer = (match, name, params) => {
  const hash = makeHash(views[name] ? views[name].contents.join("") : ''+Math.random())
  return viewOpen(name, hash, params);
}

export default compile