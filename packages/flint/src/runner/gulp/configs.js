import { $, gulp, isProduction } from './lib/helpers'
import { opts } from '../lib/fns'

export function configs(src, { dest, combine, minify, wrap }) {
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