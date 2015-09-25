import React from 'react'
// import tapEventPlugin from 'react-tap-event-plugin'
import rafBatch from './lib/reactRaf'
import runFlint from './flint'
import browserRequire from './lib/browserRequire'
import 'isomorphic-fetch'

if (process.env.production)
  rafBatch.inject();

window.React = React
window.runFlint = runFlint
window.require = browserRequire
window.__flintPackages = {}
window.$ = null // prevent breaking when writing $ styles
window.exports = {}
window.root = window
