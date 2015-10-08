const inBrowser = typeof window != 'undefined'
const root = inBrowser ? window : global

// set root variable
if (inBrowser) window.root = window
else global.root = global

if (!inBrowser) {
  // for isomorphic help
  root.document = {}
}