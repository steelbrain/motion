import webpack from 'webpack'
import gulp from 'gulp'
import { p, copy, writeFile } from '../lib/fns'
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
  const depsDir = p(opts.get('flintDir'), 'deps')
  const buildDir = p(opts.get('buildDir'), '_')

  const inFiles = [
    p(depsDir, 'packages.js'),
    p(depsDir, 'internals.js'),
    p(buildDir, opts.get('name') + '.js'),
  ]

  // write requires for webpack to build/name.pack.js
  const requireStr = name => `require("${name}");`
  const userInStr = inFiles.map(requireStr).join("\n")
  const userInFile = p(buildDir, `${opts.get('name')}.pack.js`)
  await writeFile(userInFile, userInStr)

  const outFile = p(buildDir, opts.get('name') + '.prod.js')
  await packApp(userInFile, outFile)
}

function packApp(inFile, outFile) {
  return new Promise((res, rej) => {
    webpack({
      entry: inFile,
      externals: {
        react: 'React',
        bluebird: '_bluebird',
        'react-dom': 'ReactDOM'
      },
      output: { filename: outFile },
      devtool: 'source-map'
    }, err => {
      if (err) return rej(err)
      else res()
    })
  })
}

export function assets() {
  gulp.src('.flint/static/**')
    .pipe(gulp.dest(p(opts.get('buildDir'), '_', 'static')))

  var stream = gulp
    .src(['*', '**/*', '!**/*.jsf?', ], { dot: false })
    .pipe(gulp.dest(p(opts.get('buildDir'))));
}

export default { flint, react, assets, app }