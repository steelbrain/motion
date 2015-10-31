import gulp from 'gulp'
import { p, copy } from '../lib/fns'
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

export function packages() {
  var read = p(opts.get('flintDir'), 'deps', 'packages.js')
  var write = p(opts.get('buildDir'), '_', 'packages.js')
  copyWithSourceMap(read, write);
}

export function assets() {
  gulp.src('.flint/static/**')
    .pipe(gulp.dest(p(opts.get('buildDir'), '_', 'static')))

  var stream = gulp
    .src(['*', '**/*', '!**/*.jsf?', ], { dot: false })
    .pipe(gulp.dest(p(opts.get('buildDir'))));
}

export default { flint, react, packages, assets }