'use babel'

import FlintTransform from 'flint-transform'
import getOption from './opts'

export function isProduction() {
  return getOption('build')
}

export function getBabelConfig({
  log = null,
  writeStyle = null,
  onMeta = null,
  onImports = null,
  onExports = null
}) {
  const transformParameters = {
    log,
    writeStyle,
    onMeta,
    onImports,
    onExports,
    basePath: getOption('dir'),
    production: isProduction(),
    selectorPrefix: getOption('config').selectorPrefix || '#_flintapp ',
  }
  return {
    breakConfig: true, // avoid reading .babelrc
    jsxPragma: 'view.el',
    stage: 1,
    blacklist: ['es6.tailCall', 'strict'],
    retainLines: getOption('pretty') ? false : true,
    comments: true,
    optional: ['regenerator', 'runtime'],
    plugins: [FlintTransform.file(transformParameters)],
    extra: { production: isProduction() }
  }
}
