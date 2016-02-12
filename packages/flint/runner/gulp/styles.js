import { $, gulp, pipefn } from './lib/helpers'
import opts from '../opts'
import { p, mkdir, handleError, log } from '../lib/fns'

export async function styles() {
  const where = {
    src: opts('styleDir'),
    glob: ['*', '**/*'],
    out: opts('styleOutDir')
  }

  await mkdir(where.out)
  return gulpStyles(where)
}

function gulpStyles({ src, glob, out }) {
  let stream = gulp.src(glob, { cwd: src })

  if (opts('watch'))
    stream = stream
      .pipe($.watch(glob, { readDelay: 1 }))
      // TODO install these and make this work
      .pipe($.cached('styles'))
      .pipe($.remember())

  return new Promise((resolve, reject) => {
    stream
      .pipe($.concat(opts('styleOutName')))
      .pipe(gulp.dest(out))
      .on('end', () => {
        log.gulp('finished styles')
        resolve()
      })
      .on('error', reject)
  })
}