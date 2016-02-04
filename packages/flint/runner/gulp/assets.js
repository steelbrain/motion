import { $, gulp, pipefn } from './lib/helpers'
import opts from '../opts'
import { p, mkdir, handleError } from '../lib/fns'

export async function assets() {
  try {
    await * [
      assetsApp(),
      assetsStatics()
    ]
  }
  catch(e) {
    handleError(e)
  }
}

// app images, fonts, etc
function assetsApp() {
  const assets = {
    glob: ['*', '**/*', '!**/*.js', , '!**/*.js.map', '!.flint{,/**}' ],
    out: opts('buildDir')
  }

  let stream = gulp.src(assets.glob)

  if (opts('watch'))
    stream = stream.pipe($.watch(assets.glob, { readDelay: 1 }))

  return new Promise((resolve, reject) => {
    stream
        .pipe($.plumber())
        // .pipe(pipefn(out.goodFile('⇢')))
        // .pipe($.filterEmptyDirs)
        .pipe(gulp.dest(assets.out))
        .on('end', resolve)
        .on('error', reject)
  })
}

// .flint/static
async function assetsStatics() {
  const statics = {
    dir: p(opts('flintDir'), 'static'),
    glob: ['*', '**/*', '!.flint{,/**}'],
    out: p(opts('buildDir'), '_', 'static')
  }

  await mkdir(statics.out)

  let stream = gulp.src(statics.glob, { cwd: statics.dir })

  if (opts('watch'))
    stream = stream.pipe($.watch(statics.glob, { readDelay: 1 }))

  return new Promise((resolve, reject) => {
    stream
        .pipe($.plumber())
        // .pipe(pipefn(out.goodFile('⇢')))
        // .pipe($.filterEmptyDirs)
        .pipe(gulp.dest(statics.out))
        .on('end', resolve)
        .on('error', reject)
  })
}