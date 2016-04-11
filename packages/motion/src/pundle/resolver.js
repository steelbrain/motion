'use strict'

/* @flow */

import Path from 'path'

function pundleResolver(pundle: Object) {
  pundle.path.onBeforeModuleResolve(function(event) {
    if (event.moduleName.indexOf('$rootDirectory') !== 0) {
      return
    }
    event.path = Path.join(pundle.config.rootDirectory, Path.relative('$rootDirectory', event.moduleName))
  })
}

module.exports = pundleResolver
