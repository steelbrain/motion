import webpack from 'webpack'
import uglify from 'uglify-js'
import gulp from 'gulp'
import log from '../lib/log'
import { p, copy, writeFile, readFile } from '../lib/fns'
import opts from '../opts'

async function copyWithSourceMap(file, dest) {
  try { await copy(file, dest) }
  catch(e) { console.log("Couldn't copy", file) }
  try { await copy(file + '.map', dest + '.map') }
  catch(e) {}
}

export function flint() {
  var read = p(opts.get('modulesDir'), 'flint-js', 'dist', 'flint.prod.js');
  var write = p(opts.get('buildDir'), '_', 'flint.prod.js');
  return copyWithSourceMap(read, write)
}

export function react() {
  var read = p(opts.get('modulesDir'), 'flint-js', 'dist', 'react.prod.js');
  var write = p(opts.get('buildDir'), '_', 'react.prod.js');
  return copyWithSourceMap(read, write)
}

// bundles together packages.js, internals.js and user app files
export async function app() {
  log('copy: app: reading packages + internals')
  const buildDir = p(opts.get('buildDir'), '_')
  const appFile = p(buildDir, opts.get('saneName') + '.js')

  const inFiles = await *[
    readFile(p(opts.get('depsDir'), 'packages.js')),
    readFile(p(opts.get('depsDir'), 'internals.js')),
    readFile(appFile),
  ]

  const inFilesConcat = inFiles.join(";\n")

  const outStr = (
    preTemplate(opts.get('saneName')) +
    inFilesConcat +
    postTemplate(opts.get('saneName'))
  )

  // overwrite with full app code
  await writeFile(appFile, outStr)

  console.log("\n  Minifying".bold)
  const minified = uglify.minify(outStr, {
    fromString: true
  })

  const final = minified.code

  const outFile = p(buildDir, opts.get('saneName') + '.prod.js')
  await writeFile(outFile, final)
}

export function assets() {
  gulp.src('.flint/static/**')
    .pipe(gulp.dest(p(opts.get('buildDir'), '_', 'static')))

  var stream = gulp
    .src(['*', '**/*', '!**/*.js' ], { dot: false })
    .pipe(gulp.dest(p(opts.get('buildDir'))));
}

export default { flint, react, assets, app }


function preTemplate(name) {
  return `window.flintRun_NAME = function flintRun_NAME(node, opts, cb) {
    var FlintInstace = opts.Flint || runFlint;
    var Flint = FlintInstace(node, opts, cb);

    (function(Flint) {
  `.replace(/NAME/g, name)
}

function postTemplate(name) {
  return `

      Flint.init()
    })(Flint);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = flintRun_NAME
  }`.replace(/NAME/g, name)
}