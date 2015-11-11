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
      removeSheet(msg.view)
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

function createSheet(name, href) {
  let tag = document.createElement('link')
  tag.href = href
  tag.rel = "stylesheet"
  tag.class = name
  return tag
}

function sheetSelector(name) {
  return `.Style${name}`
}

function removeSheet(name) {
  let tag = document.querySelector(sheetSelector(name))
  if (tag && tag.parentNode)
    tag.parentNode.removeChild(tag)
}

// return namespace for guarding things
function safeLoader() {
  let last = {}
  let isLoading = {}
  let wait = {}

  // guards against multiple scripts loading at once
  return function guard(key, done) {
    if (isLoading[key])
      return

    let oldTag = last[key]
    isLoading[key] = true

    done(oldTag, newTag => {
      // clear
      last[key] = newTag

      // if waiting for a newer tag, run that now
      if (isLoading[key]) {
        isLoading[key] = false
        done(last[key], noop)
      }
    })
  }
}

let sheetGuard = safeLoader()

function addSheet(name) {
  sheetGuard(name, (tag, done) => {
    if (!tag) {
      let href = `/__/styles/${name}.css`
      tag = (
        document.querySelector(`link${sheetSelector(name)}`) ||
        document.querySelector(`link[href="${href}"]`)
      )

      if (!tag)
        tag = createSheet(name, href)
    }

    replaceTag(tag, 'href', done)
  })
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
  return str.replace(/\?[0-9]+$/, '')
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

  // TODO: this should wait for all tags to be done loading
  setTimeout(Flint.render, 10)
}

function cloneNode(node) {
  if (node.tagName != 'SCRIPT') {
    return node.cloneNode(false)
  }
  else {
    let clone = document.createElement('script')

    const attrs = node.attributes
    for (let i = 0; i < attrs.length; i++)
       if (attrs[i].name != 'src')
         clone.setAttribute(attrs[i].name, attrs[i].value)

    return clone
  }
}

function replaceTag(tag, attr, cb) {
  if (!tag) return console.error('no tag')

  let parent = tag.parentNode
  let clone = cloneNode(tag)

  clone[attr] = replaceTime(tag.getAttribute(attr))

  clone.onload = () => {
    try {
      if (parent) parent.removeChild(tag)
    }
    catch(e) { console.log('error removing', tag, attr) }

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

function noop() {}