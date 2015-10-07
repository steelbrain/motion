// this file is only used by browser

import fetch from 'whatwg-fetch'
import React from 'react'
import rafBatch from './lib/reactRaf'
import runFlint from './flint'
import browserRequire from './lib/browserRequire'

if (process.env.production)
  rafBatch.inject();
else {
  // prevent breaking when writing $ styles in auto-save mode
  window.$ = null
}

window.fetch = fetch
window.React = React
window.runFlint = runFlint
window.require = browserRequire
window.__flintPackages = {}
window.exports = {}
