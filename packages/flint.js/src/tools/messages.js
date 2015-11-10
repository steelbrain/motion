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
  if (tag && tag.parentNode)
    tag.parentNode.removeChild(tag)
}

function refreshTag(tag, attr, val, cb) {
  tag.setAttribute(attr, replaceTime(val))
  setTimeout(cb)
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

    const finish = opts.reloadAll ? reloadAllScripts : renderFlint
    const tag = replaceTag(el, finish)
  }
}

function removeTime(str) {
  return str.replace(/\?.*/, '')
}

function replaceTime(str) {
  return removeTime(str) + `?${Date.now()}`
}

function reloadAllScripts() {
  const scripts = document.querySelectorAll('.__flintScript')

  if (!scripts.length)
    return

  let total = scripts.length

  _Flint.resetViewState()

  ;[].forEach.call(scripts, script => {
    replaceTag(script)
  })

  setTimeout(Flint.render, 10)
}

let lastLoadedAt = {}
let lastScript = {}

function replaceTag(tag, cb) {
  if (!tag || !tag.parentNode)
    return console.log('no parent for', tag)

  let replacement = document.createElement(tag.tagName)
  replacement.src = replaceTime(tag.getAttribute('src'))
  replacement.onload = cb || noop

  const attrs = tag.attributes
  for (let i = 0; i < attrs.length; i++)
    if (attrs[i].name != 'src')
      replacement.setAttribute(attrs[i].name, attrs[i].value)

  const parent = tag.parentNode
  parent.removeChild(tag)
  parent.appendChild(replacement)

  return replacement
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

    // this is due to gulp sending script:add when we delete files
    if (!tag) return

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
    setTimeout(Flint.render)
    renderAttempts = 0
  }
  else {
    renderAttempts++
    setTimeout(renderFlint, 50)
  }
}

function noop() {}