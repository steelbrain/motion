'use strict'

/* @flow */

import Path from 'path'

function pundleResolver(pundle: Object) {
  pundle.path.onBeforeModuleResolve(function(event) {
    if (event.moduleName.indexOf('$root') !== 0) {
      return
    }
    event.path = Path.join(pundle.config.rootDirectory, Path.relative('$root', event.moduleName))
  })
}

module.exports = pundleResolver
