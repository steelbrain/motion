import chalk from 'chalk'
import _gulp from 'gulp'
import _babel from './gulp-babel'
import _through from 'through2'
import loadPlugins from 'gulp-load-plugins'
import { _, path, log } from '../../lib/fns'
import opts from '../../opts'
import cache from '../../cache'
import scriptsGlob from './scriptsGlob'

export const serializeCache = _.throttle(cache.serialize, 200)
export const isSourceMap = file => path.extname(file) === '.map'
export const relative = file => path.relative(opts('appDir'), file.path)
export const time = _ => typeof _ == 'number' ? ` ${_}ms` : ''
export const out = {}
out.badFile = (file, err) => console.log(`  ✖ ${relative(file)}`.red),
out.goodFile = symbol => (file, ms) =>
  console.log(
    `  ${chalk.dim(symbol)} ${chalk.bold(relative(file))} `
    + chalk.dim(file.startTime ? time((Date.now() - file.startTime) || 1).dim : '')
  )
out.goodScript = out.goodFile('-')

export const $ = loadPlugins()
export const isBuilding = () => opts('build') && !opts('watch')
export const hasBuilt = () => opts('hasRunInitialBuild')
export const hasFinished = () => hasBuilt() && opts('hasRunInitialInstall')
export const isProduction = () => opts('build')

export const through = _through
export const babel = _babel
export const gulp = _gulp
export const SCRIPTS_GLOB = scriptsGlob

export function pipefn(fn) {
  return _through.obj(function(file, enc, next) {
    let result = fn && fn(file)

    if (typeof result == 'string') {
      file.contents = new Buffer(result)
      next(null, file)
      return
    }

    next(null, file)
  })
}