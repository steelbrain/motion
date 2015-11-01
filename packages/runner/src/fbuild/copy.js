import webpack from 'webpack'
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
  const depsDir = p(opts.get('flintDir'), 'deps')
  const buildDir = p(opts.get('buildDir'), '_')

  const inFiles = await *[
    readFile(p(depsDir, 'packages.js')),
    readFile(p(depsDir, 'internals.js')),
    readFile(p(buildDir, opts.get('name') + '.js')),
  ]

  const inFilesConcat = inFiles.join(";\n")
  const wrapper = await readFile(`${__dirname}/../../../templates/build.template.js`)

  const outStr = wrapper.toString()
    .replace(/NAME/g, opts.get('name'))
    .replace(/CONTENTS/g, inFilesConcat)

  const outFile = p(buildDir, opts.get('name') + '.prod.js')

  await writeFile(outFile, outStr)
}

export function assets() {
  gulp.src('.flint/static/**')
    .pipe(gulp.dest(p(opts.get('buildDir'), '_', 'static')))

  var stream = gulp
    .src(['*', '**/*', '!**/*.jsf?', ], { dot: false })
    .pipe(gulp.dest(p(opts.get('buildDir'))));
}

export default { flint, react, assets, app }