import { compileError, compileSuccess } from './errors'
import { favicon } from './favicon'
import socket from './socket'

export default function run(browser, opts) {
  socket(browser, opts, {
    'editor:location': msg => {
      browser.editorLocation = msg
    },

    'view:locations': msg => {
      browser.viewLocations = msg
    },

    'script:add': msg => {
      // Motion.timer.lastMsgInfo = { start: msg.startTime }
      replaceScript(msg)
    },

    'stylesheet:add': msg => {
      addSheet(msg.view)
    },

    'stylesheet:remove': msg => {
      removeSheet(msg.view)
    },

    'compile:error': msg => {
      favicon.bad()
      compileError(msg.error)
    },

    'compile:success': msg => {
      favicon.good()
      compileSuccess()
    },

    'packages:reload': reloadScript('__motionExternals'),
    'internals:reload': reloadScript('__motionInternals', { reloadAll: true }),

    'file:delete': ({ name }) => {
      if (!Motion) return // if attempting before initial load
      let views = _Motion.getFile(name)
      views.map(removeSheet)
      removeScript(name)

      Motion.deleteFile(name)
    },

    'file:outsideChange': ({ name, changed }) => {
      _Motion.fileChanged[name] = changed
    },

    'motion:opts': opts => {
      window.__motionopts = opts
    },


    // coming from editor to browser

    'editor:state': state => {
      browser.editor = state
      browser.emitter.emit('editor:state')
    }
  })
}

// tag loader is a throttler
// it accepts requests to load tags
// and once those tags load, it will continue

function TagLoader() {
  let last = {}
  let loading = {}
  let wait = {}

  return function(name, load) {
    let oldTag = last[name]

    if (wait[name]) {
      return
    }

    if (loading[name]) {
      wait[name] = true
      return
    }

    loading[name] = true

    load(oldTag, onDone)

    function onDone(newTag) {
      last[name] = newTag
      loading[name] = false

      if (wait[name]) {
        wait[name] = false
        load(last[name], onDone)
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
const scriptUrl = name => `/_/${name}.js`
const findScript = name => document.querySelector(scriptSelector(scriptUrl(name)))

const sheetSelector = href => `link[href^="${removeTime(removeBase(href))}"]`
const sheetUrl = name => `/__/styles/${name}.css`
const findSheet = name => document.querySelector(sheetSelector(sheetUrl(name)))

const scrLoad = TagLoader()
const cssLoad = TagLoader()

function addScript(src) {
  let path = src.replace('/_/', '')
  let start = Date.now()
  socket.send('script:load', { path })
  scrLoad(src, (lastTag, done) => {
    let script = lastTag
      || document.querySelector(scriptSelector(src))
      || createScript(src)

    replaceTag(script, 'src', function finish() {
      // console.log('script load took', Date.now() - start)
      socket.send('script:done', { path })
      done()
    })
  })
}

function addSheet(name) {
  cssLoad(name, (lastTag, done) => {
    replaceTag(lastTag || findSheet(name) || createSheet(sheetUrl(name)), 'href', done)
  })
}

function getParent(tag) {
  if (tag.parentNode) return tag.parentNode
  if (tag.nodeName == 'SCRIPT') return document.body
  else return document.head
}

function replaceTag(tag, attr, after = () => {}) {
  if (!tag) return

  let parent = getParent(tag)
  let clone = cloneNode(tag, attr)
  let already = false
  let cielTimeout

  const afterFinish = () => {
    if (already) return
    clearTimeout(cielTimeout)
    already = true
    removeTag(tag, parent, () => after(clone))
  }

  clone.onerror = afterFinish
  clone.onload = afterFinish
  parent.appendChild(clone)

  // ceil for slow loads
  cielTimeout = setTimeout(() => {
    if (already) return
    removeTag(tag, tag.parentNode, afterFinish, { leftover: 1 })
  }, 120)
}

function removeTag(tag, parent, cb, { leftover = 2 } = {}) {
  try {
    parent.removeChild(tag)
    setTimeout(cb)
  }
  catch(e) {
    const isScript = tag.nodeName == 'SCRIPT'
    let tags = document.querySelectorAll(isScript ? scriptSelector(tag.src) : sheetSelector(tag.href))

    // attempt force removal
    for (let i = 0; i < tags.length - leftover; i++) {
      const tag = tags[i]
      try {
        tag.parentNode.removeChild(tag)
      }
      catch(e) {
        try {
          document.body.removeChild(tag)
          document.head.removeChild(tag)
        }
        catch(e) { /* oh well */ }
      }
    }

    // wait a bit longer after recovery
    setTimeout(cb, 30)
  }
}

function reloadScript(id, opts = {}) {
  return (data) => {
    const el = document.getElementById(id)
    if (!el) return

    const finish = opts.reloadAll ? () => reloadImportScripts(data) : renderMotion
    const tag = replaceTag(el, 'src', finish)
  }
}

function replaceScript({ name, timestamp, src }, cb) {
  addScript(src || `/_${name}`)
}

let getScriptsByPaths = paths =>
  paths.map(path => document.querySelector(`.__motionScript[src*="${path}"]`))

function reloadImportScripts({ importers } = {}) {
  // only reload stuff thats changed with imports, if possible
  const removeByImporter = importers && importers.length

  let scripts = removeByImporter
    ? getScriptsByPaths(importers)
    : document.querySelectorAll('.__motionScript')

  if (!scripts.length)
    return

  let total = scripts.length

  if (removeByImporter)
    importers.forEach(_Motion.resetViewsInFile)
  else
    _Motion.resetViewState()

  let scriptLoaders = []

  ;[].forEach.call(scripts, script =>
    scriptLoaders.push(new Promise(resolve => replaceTag(script, 'src', resolve)))
  )

  Promise.all(scriptLoaders)
    .then(() => {
      Motion.run()
    })
}

let renderAttempts = 0

function renderMotion() {
  if (renderAttempts > 10) {
    renderAttempts = 0
    return
  }

  if (typeof Motion != 'undefined') {
    setTimeout(Motion.run)
    renderAttempts = 0
  }
  else {
    renderAttempts++
    setTimeout(renderMotion, 50)
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

function createScript(src) {
  let tag = document.createElement('script')
  tag.src = src
  return tag
}

function createSheet(href) {
  let tag = document.createElement('link')
  tag.href = href
  tag.rel = "stylesheet"
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

function removeSheet(name) {
  let tag = findSheet(name)
  if (tag && tag.parentNode)
    tag.parentNode.removeChild(tag)
}

function removeScript(name) {
  let tag = findScript(name.replace('.js', ''))
  if (tag && tag.parentNode) {
    tag.parentNode.removeChild(tag)
    Motion.removeFile(name)
  }
}
