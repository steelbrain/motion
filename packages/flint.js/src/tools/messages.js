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
      replaceScript(msg)
    },

    'stylesheet:add': msg => {
      addSheet(msg)
    },

    'stylesheet:remove': msg => {
      removeSheet(msg)
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

function styleId(name) {
  return '_flintV' + name
}

function removeSheet({ view }) {
  let tag = document.getElementById(styleId(view))
  console.log(view)
  if (tag && tag.parentNode)
    tag.parentNode.removeChild(tag)
}

function refreshTag(tag, attr, val, cb) {
  tag.onload = cb
  tag.setAttribute(attr, val + '?' + Date.now())
}

function addSheet({ view }) {
  let href = '/__/styles/' + view + '.css'
  let tag = document.getElementById(styleId(view))

  if (!tag) {
    tag = document.createElement('link')
    tag.href = href
    tag.rel = "stylesheet"
    tag.id = styleId(view)
    document.head.appendChild(tag)
    return
  }

  refreshTag(tag, 'href', href)
}

function reloadScript(id, opts = {}) {
  return () => {
    const el = document.getElementById(id)
    if (!el) return

    const finish = opts.reloadAll ? reloadUserScripts : renderFlint
    const tag = replaceScript({ src }, finish)
  }
}

function reloadUserScripts() {
  const scripts = document.querySelectorAll('.__flintScript');
  let loaded = 0
  let total = scripts.length

  _Flint.resetViewState()

  ;[].forEach.call(scripts, script => {
    refreshTag(script, 'src', script.src.replace(/\?.*/, ''))
  })

  function doneLoading() {
    if (loaded == scripts.length)
      Flint.render()
    else
      setTimeout(doneLoading, 20)
  }

  setTimeout(doneLoading)
}

let lastLoadedAt = {}
let lastScript = {}

function replaceTag(tag) {
  if (!tag || !tag.parentNode)
    return console.log('no parent for', tag)

  let replacement = document.createElement(tag.tagName)

  const attrs = tag.attributes
  for (let i = 0; i < attrs.length; i++)
    replacement.setAttribute(attrs[i].name, attrs[i].value)

  const parent = tag.parentNode
  parent.removeChild(tag)
  parent.appendChild(replacement)
}

function replaceScript({ name, timestamp, src }, cb) {
  const jsName = removeFlintExt(name)

  if (!lastLoadedAt[jsName] || lastLoadedAt[jsName] < timestamp) {
    lastLoadedAt[jsName] = timestamp

    let fullSrc = src || `/_${jsName}`
    let tag = lastScript[jsName]

    if (!lastScript[jsName]) {
      tag = document.querySelector(`script[src="${fullSrc}"]`)
    }

    lastScript[jsName] = replaceTag(tag)
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