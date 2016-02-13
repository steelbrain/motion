import { $, gulp, multipipe } from './lib/helpers'
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

// todo this is re-running every build --watch change, use $.watch
function gulpStyles({ src, glob, out }) {
  return new Promise((resolve, reject) => {
    gulp.src(glob, { cwd: src })
      .pipe($.plumber())
      .pipe($.if(opts('watch'),
        $.multipipe(
          $.cached('styles'),
          $.remember('styles'),
        )
      ))
      .pipe($.concat(opts('styleOutName')))
      .pipe(gulp.dest(out))
      .on('end', () => {
        log.gulp('finished styles')
        resolve()
      })
      .on('error', reject)

    // resolve right away for watch
    if (opts('watch')) resolve()
  })
}