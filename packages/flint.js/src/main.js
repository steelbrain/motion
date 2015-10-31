// this file is only used by browser

import 'whatwg-fetch'
import React from 'react'
import rafBatch from './lib/reactRaf'
import runFlint from './flint'
import './shim/require'

if (process.env.production)
  rafBatch.inject();
else {
  // prevent breaking when writing $ styles in auto-save mode
  window.$ = null
}

window.React = React
window.runFlint = runFlint
window.__flintPackages = {}
window.__flintInternals = {}
window.exports = {}

// console.warn
const originalWarn = console.warn
window.console.warn = (...args) => {
  if (args[0] && args[0].indexOf('Unsupported CSS property "dispay') == 0) return
  originalWarn.call(console,...args)
}