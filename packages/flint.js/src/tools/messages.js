import { compileError, compileSuccess } from './errors';
import removeFlintExt from '../lib/flintExt';

export default function run(browser, opts) {
  const ws = new WebSocket('ws://localhost:' + opts.websocketPort + '/')

  const actions = {
    'editor:location': msg => {
      browser.editorLocation = msg;
    },

    'view:locations': msg => {
      browser.viewLocations = msg;
    },

    'script:add': msg => {
      addScript(msg, renderFlint)
    },

    'compile:error': msg => {
      compileError(msg.error);
    },

    'compile:success': msg => {
      compileSuccess()
    },

    'packages:reload': reloadScript('__flintPackages'),
    'internals:reload': reloadScript('__flintInternals', { reloadAll: true }),

    'file:delete': file => {
      Flint.deleteFile(file.name)
    }
  }

  ws.onmessage = function(message) {
    message = JSON.parse(message.data)
    if (!message) return

    const action = actions[message._type];

    if (action)
      action(message)

    browser.data = message
    browser.emitter.emit(message._type)
  }
}

function reloadScript(id, opts = {}) {
  return () => {
    const el = document.getElementById(id)

    if (!el) return

    const src = el.src
    removeEl(el)

    const finish = opts.reloadAll ? reloadUserScripts : renderFlint
    const tag = addScript({ src }, finish)

    tag.setAttribute('id', id)
  }
}

function reloadUserScripts() {
  const scripts = document.querySelectorAll('.__flintScript');

  let loaded = 0
  let total = scripts.length

  // TODO: have a function in flint.js that does this
  _Flint.views = {}
  _Flint.mountedViews = {}
  _Flint.lastWorkingViews = {}
  _Flint.firstRender = true;

  [].forEach.call(scripts, script => {
    let replacement = document.createElement('script');
    replacement.onload = function() { loaded++ }
    const attrs = script.attributes

    for (let i = 0; i < attrs.length; i++)
      replacement.setAttribute(attrs[i].name, attrs[i].value)

    removeEl(script)
    document.body.appendChild(replacement)
  })

  function doneLoading() {
    if (loaded == scripts.length)
      Flint.render()
    else
      setTimeout(doneLoading, 20)
  }

  setTimeout(doneLoading)
}

const body = document.getElementsByTagName('body')[0]
let lastLoadedAt = {}
let lastScript = {}
let finished = true

function addScript(message, cb) {
  if (!finished) return
  finished = false

  const { name, timestamp, src } = message;
  const jsName = removeFlintExt(name)

  if (!lastLoadedAt[jsName] || lastLoadedAt[jsName] < timestamp) {
    lastLoadedAt[jsName] = timestamp

    let fullSrc = (src || '/_' + jsName)

    if (lastScript[jsName])
      fullSrc = fullSrc + "?" + timestamp

    // remove last script
    if (lastScript[jsName])
      lastScript[jsName].parentElement.removeChild(lastScript[jsName])
    else {
      const oldScript = document.querySelector(`script[src="${fullSrc}"]`)
      if (oldScript) {
        const oldScriptParent = oldScript.parentElement
        if (oldScriptParent) oldScriptParent.removeChild(oldScript)
      }
    }

    const script = document.createElement('script')
    script.src = fullSrc
    body.appendChild(script)
    lastScript[jsName] = script
    script.onload = () => {
      finished = true
      cb()
    }
    script.onerror = () => {
      finished = true
    }
    setTimeout(() => {
      finished = true
    }, 40)

    return script
  }
}

function removeEl(el) {
  var parent = el.parentNode
  parent.removeChild(el)
}

let renderAttempts = 0

function renderFlint() {
  if (renderAttempts > 10) {
    renderAttempts = 0
    return
  }

  if (typeof Flint != 'undefined') {
    Flint.render()
    renderAttempts = 0
  }
  else {
    renderAttempts++
    setTimeout(renderFlint, 50)
  }
}