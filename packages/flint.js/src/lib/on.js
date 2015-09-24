const inBrowser = typeof window != 'undefined'
const root = inBrowser ? window : global

const listeners = {};
const events = {};

function addListener(name, target, cb) {
  if (!listeners[name]) {
    listeners[name] = target['addEventListener'](name, () => {
      cb()
    })
  }
}

// on
const onEvents = {
  mount(scope, event) {
    if (scope)
      scope.events.mount.push(event)
  },
  props(scope, event) {
    if (scope)
      scope.events.props.push(event);
  }
}

const on = (scope, name, cb) => {
  if (!cb) {
    cb = name
    name = scope
    scope = root
  }

  const event = onEvents[name];

  if (scope == root || !event) {
    return root.addEventListener(name, cb);
  }

  return event(scope, cb);
}

export default on
