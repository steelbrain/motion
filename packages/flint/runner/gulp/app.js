import flintTransform from 'flint-transform'
import { $, gulp, babel, isSourceMap, isProduction } from './lib/helpers'
import opts from '../opts'
import { p, readdir, handleError } from '../lib/fns'

export async function app() {
  try {
    const dest = p(opts('buildDir'), '_')
    const deps = opts('deps')
    const minify = opts('config').minify

    let appFiles = await readdir(opts('outDir'))
    appFiles = appFiles.map(f => f.fullPath).filter(x => !isSourceMap(x)).sort()

    if (minify)
      console.log(`\n  Minifying...`.dim)

    // build parallel
    await* [
      buildForDeploy(deps.internalsOut, { dest, minify }),
      buildForDeploy(deps.externalsOut, { dest, minify }),
      buildForDeploy(appFiles, { dest, minify, combine: true, wrap: true })
    ]
  }
  catch(e) {
    handleError(e)
  }
}

function buildForDeploy(src, { dest, combine, minify, wrap }) {
  return new Promise((resolve, reject) => {
    gulp.src(src)
      .pipe($.sourcemaps.init())
      // .pipe($.if(combine, $.order(src)))
      .pipe($.if(combine, $.concat(`${opts('saneName')}.js`)))
      .pipe($.if(wrap,
        babel({
          whitelist: [],
          retainLines: true,
          comments: true,
          plugins: [flintTransform.app({ name: opts('saneName') })],
          compact: true,
          extra: { production: isProduction() }
        })
      ))
      .pipe($.if(minify, $.uglify()))
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest(dest))
      .on('end', resolve)
      .on('error', reject)
  })
}
