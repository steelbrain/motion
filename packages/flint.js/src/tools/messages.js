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
    let oldTag = last[key]

    if (loading[key]) {
      wait[key] = true
      return
    }

    loading[key] = true

    load(oldTag, onDone)

    function onDone(newTag) {
      last[key] = newTag
      loading[key] = false

      if (wait[key]) {
        wait[key] = false
        load(last[key], onDone)
      }
    }
  }
}

/*

  This should be a closed async loop for hot loading files.

  ws:add => addScript => tagloader => replaceTag =>
    replaceTag => (tagLoader|null)

*/

const scriptSelector = src => `script[src^="${removeTime(removeBase(src))}"]`
const sheetSelector = href => `link[href^="${removeTime(removeBase(href))}"]`

const scrLoad = TagLoader()
const cssLoad = TagLoader()

function addScript(src) {
  scrLoad(src, (lastTag, done) => {
    lastTag = lastTag || document.querySelector(scriptSelector(src))
    replaceTag(lastTag, 'src', done)
  })
}

function addSheet(name) {
  cssLoad(name, (lastTag, done) => {
    const href = `/__/styles/${name}.css`
    lastTag = lastTag || document.querySelector(sheetSelector(href)) || createSheet(href)
    replaceTag(lastTag, 'href', done)
  })
}

function getParent(tag) {
  if (tag.parentNode) return tag.parentNode
  if (tag.nodeName == 'SCRIPT') return document.body
  else return document.head
}

function replaceTag(tag, attr, after) {
  if (!tag) return

  let parent = getParent(tag)
  let clone = cloneNode(tag, attr)

  const afterFinish = () => {
    setTimeout(() => {
      removeTag(tag, parent, () => {
        after && after(clone)
      })
    })
  }

  clone.onerror = afterFinish
  clone.onload = afterFinish
  parent.appendChild(clone)
}

function removeTag(tag, parent, cb, attempts = 0) {
  if (!parent) return cb()

  try {
    parent.removeChild(tag)
    setTimeout(cb, 2)
  }
  catch(e) {
    if (attempts > 3) {
      const isScript = tag.nodeName == 'SCRIPT'
      let tags

      if (isScript) {
        tags = document.querySelectorAll(scriptSelector(tag.src))
      }
      else {
        tags = document.querySelectorAll(sheetSelector(tag.href))
      }

      // remove all but last one
      for (let i = 0; i < tags.length - 1; i++) {
        const tag = tags[i]
        try {
          tag.parentNode.removeChild(tag)
        }
        catch(e) {
          try {
            document.body.removeChild(tag)
            document.head.removeChild(tag)
          }
          catch(e) { //oh well
            tag[isScript ? 'src' : 'href'] = ''
          }
        }
      }

      setTimeout(cb, 5)
    }
    else
      setTimeout(() => removeTag(tag, parent, cb, ++attempts), 50)
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

function removeBase(str) {
  return str.replace(/^http\:\/\/[^/]+/, '')
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

function sheetClassSelector(name) {
  return `.Style${name}`
}

function removeSheet(name) {
  let tag = document.querySelector(sheetClassSelector(name))
  if (tag && tag.parentNode)
    tag.parentNode.removeChild(tag)
}