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
      addSheet(msg.view)
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

function createSheet(href) {
  let tag = document.createElement('link')
  tag.href = href
  tag.rel = "stylesheet"
  return tag
}

function styleId(name) {
  return '_flintV' + name
}

function removeSheet({ view }) {
  let tag = document.getElementById(styleId(view))
  if (tag && tag.parentNode)
    tag.parentNode.removeChild(tag)
}

function safeLoader() {
  let cachedTag = {}
  let loading = {}
  let wait = {}

  return function guard(key, fn) {
    let tag = cachedTag[key]

    if (loading[key]) {
      wait[key] = true
      return
    }

    loading[key] = true

    fn(tag, newTag => {
      cachedTag[key] = newTag
      loading[key] = false
      if (wait[key]) {
        wait[key] = false
        fn(key)
      }
    })
  }
}

let sheetGuard = safeLoader()

function addSheet(view) {
  sheetGuard(view, adder)

  function adder(tag, done) {
    if (!tag) {
      let href = `/__/styles/${view}.css`
      tag = document.querySelector(`link[href="${href}"]`)

      if (!tag)
        tag = createSheet(href)
    }

    replaceTag(tag, 'href', done)
  }
}

function reloadScript(id, opts = {}) {
  return () => {
    const el = document.getElementById(id)
    if (!el) return

    const finish = opts.reloadAll ? reloadAllScripts : renderFlint
    const tag = replaceTag(el, 'src', finish)
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
    replaceTag(script, 'src')
  })

  setTimeout(Flint.render, 10)
}

function replaceTag(tag, attr, cb) {
  if (!tag) return console.error('no tag')

  let parent = tag.parentNode
  let clone = tag.cloneNode(false)

  clone[attr] = replaceTime(tag.getAttribute(attr))

  clone.onload = () => {
    try {
      if (parent) parent.removeChild(tag)
    }
    catch(e) {
      console.log('error removing', tag, attr)
    }

    clone.onreadystatechange = null
    cb && cb(clone)
  }

  if (parent)
    parent.appendChild(clone)
  else
    document.head.appendChild(clone)
}

let lastLoadedAt = {}
function replaceScript({ name, timestamp, src }, cb) {
  const jsName = removeFlintExt(name)

  if (!lastLoadedAt[jsName] || lastLoadedAt[jsName] < timestamp) {
    lastLoadedAt[jsName] = timestamp
    addScript(src || `/_${jsName}`)
  }
}

let scriptGuard = safeLoader()
function addScript(src) {
  scriptGuard(src, adder)

  function adder(tag, done) {
    if (!tag)
      tag = document.querySelector(`script[src="${src}"]`)
    if (!tag)
      return

    replaceTag(tag, 'src', done)
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