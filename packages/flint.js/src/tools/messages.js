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
      compileError(msg.error)
    },

    'compile:success': msg => {
      compileSuccess()
    },

    'packages:reload': reloadScript('__flintExternals'),
    'internals:reload': reloadScript('__flintInternals', { reloadAll: true }),

    'file:delete': file => {
      Flint.deleteFile(file.name)
    }
  }

  ws.onmessage = function(message) {
    message = JSON.parse(message.data)
    if (!message) return

    const action = actions[message._type]
    if (action) action(message)

    browser.data = message
    browser.emitter.emit(message._type)
  }
}

function TagLoader() {
  let last = {}
  let loading = {}
  let wait = {}

  return function(key, load) {
    let tag = last[key]

    if (loading[key]) {
      wait[key] = true
      return
    }

    loading[key] = true

    function afterLoad(newTag) {
      last[key] = newTag
      loading[key] = false

      if (wait[key]) {
        wait[key] = false
        load(last[key], afterLoad)
      }
    }

    load(tag, afterLoad)
  }
}

const scrLoad = TagLoader()
const cssLoad = TagLoader()

function addScript(src) {
  scrLoad(src, (lastTag, done) => {
    lastTag = lastTag || document.querySelector(`script[src^="${removeTime(src)}"]`)
    replaceTag(lastTag, 'src', done)
  })
}

function addSheet(name) {
  cssLoad(name, (lastTag, done) => {
    lastTag = lastTag || document.querySelector(`link[href^="${removeTime(`/__/styles/${name}.css`)}"]`)
    replaceTag(lastTag, 'href', done)
  })
}

let oldElements = []

function replaceTag(tag, attr, after) {
  if (!tag) return

  oldElements.push(tag)

  let parent = tag.parentNode
  let clone = cloneNode(tag, attr)

  clone.onerror = () => after && after()
  clone.onload = () => {
    after && after(clone)
    setTimeout(removeOld, 5)
  }

  if (!parent) {
    if (tag.nodeName == 'SCRIPT')
      document.body.appendChild(clone)
    else
      document.head.appendChild(clone)

    return
  }

  parent.appendChild(clone)
}

function removeOld() {
  let pending = 0

  for (let i = 0; i < oldElements.length; i++) {
    let el = oldElements.shift()

    try {
      el.parentNode.removeChild(el)
    }
    catch(e) {
      pending++
    }

    if (pending)
      setTimeout(removeOld, 50)
  }

  return true
}

function reloadScript(id, opts = {}) {
  return () => {
    const el = document.getElementById(id)
    if (!el) return

    const finish = opts.reloadAll ? reloadAllScripts : renderFlint
    const tag = replaceTag(el, 'src', finish)
  }
}

function replaceScript({ name, timestamp, src }, cb) {
  const jsName = removeFlintExt(name)
  addScript(src || `/_${jsName}`)
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

function removeTime(str) {
  return str.replace(/\?[0-9]+$/, '')
}

function replaceTime(str) {
  return removeTime(str) + `?${Date.now()}`
}

function createSheet(name, href) {
  let tag = document.createElement('link')
  tag.href = href
  tag.rel = "stylesheet"
  tag.class = name
  return tag
}

function cloneNode(node, attr) {
  let clone

  if (node.tagName != 'SCRIPT') {
    clone = node.cloneNode(false)
  }
  else {
    clone = document.createElement('script')

    const attrs = node.attributes
    for (let i = 0; i < attrs.length; i++)
       if (attrs[i].name != 'src')
         clone.setAttribute(attrs[i].name, attrs[i].value)
  }

  clone.setAttribute(attr, replaceTime(node.getAttribute(attr)))

  return clone
}

function sheetSelector(name) {
  return `.Style${name}`
}

function removeSheet(name) {
  let tag = document.querySelector(sheetSelector(name))
  if (tag && tag.parentNode)
    tag.parentNode.removeChild(tag)
}