'use strict'

/* @flow */

import Path from 'path'

function pundleResolver(pundle: Object) {
  pundle.path.onBeforeModuleResolve(function(event) {
    if (event.moduleName.indexOf('$') !== 0) {
      return
    }
    event.path = Path.join(pundle.config.rootDirectory, event.moduleName.substr(1))
  })
}

module.exports = pundleResolver
