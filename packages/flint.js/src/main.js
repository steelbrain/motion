import React from 'react'
import tapEventPlugin from 'react-tap-event-plugin'
import rafBatch from 'react-raf-batching'
import runFlint from './flint'
import browserRequire from './lib/browserRequire'
import on from './lib/on'
import { Promise } from 'bluebird'
import 'isomorphic-fetch'

React.initializeTouchEvents(true)
tapEventPlugin()

if (process.env.production)
  rafBatch.inject();

// if (inBrowser)
  // const host = uri => uri.match(/[a-z]+\:\/\/[^/]+\//)[0]

window.React = React
window.runFlint = runFlint
window.on = on
window.require = browserRequire
window.__flintPackages = {}
window.Promise = Promise
window.$ = null // prevent breaking when writing $ styles
window.exports = {}
