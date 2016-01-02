import webpack from 'webpack'
import uglify from 'uglify-js'
import gulp from 'gulp'
import { log, p, copy, writeFile, readFile, readdir, globCopy, handleError } from '../lib/fns'
import opts from '../opts'
import flintjs from 'flint-js'

async function copyWithSourceMap(file, dest) {
  try { await copy(file, dest) }
  catch(e) { console.log("Couldn't copy", file) }
  try { await copy(file + '.map', dest + '.map') }
  catch(e) { handleError(e) }
}

export function flint() {
  var read = p(flintjs(), 'dist', 'flint.prod.js');
  var write = p(opts.get('buildDir'), '_', 'flint.prod.js');
  return copyWithSourceMap(read, write)
}

export function react() {
  var read = p(flintjs(), 'dist', 'react.prod.js');
  var write = p(opts.get('buildDir'), '_', 'react.prod.js');
  return copyWithSourceMap(read, write)
}

// bundles together packages.js, internals.js and user app files
export async function app() {
  try {
    log('copy: app: reading packages + internals')
    const buildDir = p(opts.get('buildDir'), '_')
    const appFile = p(buildDir, opts.get('saneName') + '.js')

    const inFiles = await *[
      readFile(opts.get('deps').externalsOut),
      readFile(opts.get('deps').internalsOut),
      readFile(appFile)
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
  catch(e) {
    handleError(e)
  }
}

export async function styles() {
  try {
    let source = ''

    try {
      const dir = await readdir({ root: opts.get('styleDir') })
      const sources = await* dir.files.map(async file => await readFile(file.fullPath))
      source = sources.join("\n\n")
    }
    catch(e) {
      // no styles, thats ok
    }

    await writeFile(opts.get('styleOutDir'), source)
  }
  catch(e) {
    handleError(e)
  }
}

export async function assets() {
  // copy .flint/statics and assets in app dir
  await* [
    globCopy(['*', '**/*'], p(opts.get('buildDir'), '_', 'static'), { cwd: '.flint/static' }),
    globCopy(['*', '**/*', '!**/*.js' ], opts.get('buildDir'))
  ]
}

function preTemplate(name) {
  return `window.flintRun_NAME = function flintRun_NAME(node, opts, cb) {
    var FlintInstace = opts.Flint || runFlint;
    var Flint = FlintInstace(node, opts, cb);

    (function(Flint) {
  `.replace(/NAME/g, name)
}

function postTemplate(name) {
  return `

      ;Flint.init()
    })(Flint);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = flintRun_NAME
  }`.replace(/NAME/g, name)
}

export default { flint, react, assets, app, styles }