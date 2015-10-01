import errors from './errors';
import messages from './messages';
import ee from 'event-emitter'
const emitter = ee({});

window._DT = {
  emitter: emitter,
  data: null, // should be error
  on(name, cb) { emitter.on(name, cb) },
};

const opts = {
  websocketPort: window._FLINT_WEBSOCKET_PORT
}

errors(window._DT, opts);
messages(window._DT, opts);