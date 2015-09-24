import { compileError, compileSuccess } from './errors';

export default function run(browser, opts) {
  const ws = new WebSocket('ws://localhost:' + opts.websocketPort)

  const actions = {
    'editor:location': msg => {
      browser.editorLocation = msg;
    },

    'view:locations': msg => {
      browser.viewLocations = msg;
    },

    'script:add': msg => {
      browser.emitter.emit('runtime:success')
      addScript(msg, Flint.render);
    },

    'script:del': msg => {
      // TODO
    },

    'compile:error': msg => {
      compileError(msg.error);
    },

    'compile:success': msg => {
      compileSuccess()
    },

    'packages:reload': msg => {
      var el = document.getElementById('__flintPackages');
      var src = el.src;
      removeEl(el);
      addScript({ src }, Flint.render);
    }
  };

  ws.onmessage = function(message) {
    // console.log('got message', message)
    message = JSON.parse(message.data);
    if (!message) return;
    if (!message._type) {
      debugger
    }

    const action = actions[message._type];

    if (action)
      action(message);

    browser.data = message;
    browser.emitter.emit(message._type)
  };
}

let lastLoadedScript = {};

function addScript(message, cb) {
  const { name, timestamp, src } = message;

  if (!lastLoadedScript[name] || lastLoadedScript[name] < timestamp) {
    lastLoadedScript[name] = timestamp;

    const body = document.getElementsByTagName('body')[0];
    const script = document.createElement('script');
    script.src = src || '/assets' + name;
    body.appendChild(script);

    script.onload = cb;
  }
}

function removeEl(el) {
  var parent = el.parentNode;
  parent.removeChild(el);
}
