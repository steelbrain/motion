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
      browser.emitter.emit('runtime:success')
      addScript(msg)
    },

    'compile:error': msg => {
      compileError(msg.error);
    },

    'compile:success': msg => {
      compileSuccess()
    },

    'packages:reload': msg => {
      const el = document.getElementById('__flintPackages')
      const src = el.src;
      removeEl(el);

      // avoid bug when starting up and adding script
      const tag = addScript({ src }, setTimeout(Flint.render,10))
      tag.setAttribute('id', '__flintPackages')
    },

    'internals:reload': msg => {
      const el = document.getElementById('__flintInternals')
      const src = el.src;
      removeEl(el);

      // avoid bug when starting up and adding script
      const tag = addScript({ src }, setTimeout(Flint.render,10))
      tag.setAttribute('id', '__flintInternals')
    },

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

let lastLoadedAt = {};

function addScript(message, cb) {
  const { name, timestamp, src } = message;
  const jsName = removeFlintExt(name)

  if (!lastLoadedAt[jsName] || lastLoadedAt[jsName] < timestamp) {
    lastLoadedAt[jsName] = timestamp;

    const fullSrc = (src || '/_' + jsName)

    const oldScript = document.querySelector(`script[src="${fullSrc}"]`)
    if (oldScript) {
      const oldScriptParent = oldScript.parentElement
      if (oldScriptParent) oldScriptParent.removeChild(oldScript)
    }

    const body = document.getElementsByTagName('body')[0];
    const script = document.createElement('script');
    script.src = fullSrc;
    body.appendChild(script);

    script.onload = cb;

    return script
  }
}

function removeEl(el) {
  var parent = el.parentNode;
  parent.removeChild(el);
}
