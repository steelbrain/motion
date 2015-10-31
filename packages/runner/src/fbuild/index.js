import opts from '../opts'
import { p } from '../lib/fns'
import { buildScripts } from '../index'
import { stopListen } from '../keys'
import copy from './copy'
import makeTemplate from './template'

export default async function build(running, afterFirstBuild) {
  let OPTS = opts.get()

  copy.assets()

  await *[
    copy.flint(),
    copy.react(),
    copy.packages()
  ]

  if (running) {
    await buildWhileRunning()
    makeTemplate()
    stopListen()
  }
  else {
    buildScripts()
    await afterFirstBuild()
    makeTemplate()
  }
}

function buildWhileRunning() {
  console.log("Building...")
  return new Promise((res, rej) => {
    gulp.src(['.flint/out/**/*.js'])
      .pipe($.plumber(err => {
        logError(err)
        rej(err)
      }))
      .pipe($p.buildWrap())
      .pipe(gulp.dest(p(OPTS.buildDir, '_')))
      .pipe(pipefn(res))
  });
}
