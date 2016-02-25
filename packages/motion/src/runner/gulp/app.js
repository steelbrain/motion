import motionTransform from 'motion-transform'
import babel from './babel'
import { $, gulp, isSourceMap, isProduction } from './lib/helpers'
import opts from '../opts'
import { p, readdir, handleError, log } from '../lib/fns'

export async function app() {
  try {
    const dest = p(opts('buildDir'), '_')
    const deps = opts('deps')
    const minify = opts('config').minify

    if (minify)
      print(`  Minifying...`.dim)

    // build parallel
    await Promise.all([
      buildForDeploy(deps.internalsOut, { dest, minify, name: opts('saneName'), wrap: true }),
      buildForDeploy(deps.externalsOut, { dest, minify, name: 'externals' }),
    ])
  }
  catch(e) {
    handleError(e)
  }
}

function buildForDeploy(src, { dest, name, minify, wrap }) {
  return new Promise((resolve, reject) => {
    gulp.src(src)
      .pipe($.sourcemaps.init())
      // .pipe($.if(combine, $.order(src)))
      .pipe($.if(wrap, babel.app({
        retainLines: false
      })))
      .pipe($.if(minify, $.uglify()))
      .pipe($.rename(`${name}.js`))
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest(dest))
      .on('end', () => {
        log.gulp('finished', src)
        resolve()
      })
      .on('error', reject)
  })
}
