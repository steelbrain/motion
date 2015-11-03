export default function scopedOn(parentScope) {
  return function(scope, name, cb) {
    // check if they defined their own scope
    if (name && typeof name == 'string')
      return on(scope, name, cb)
    else
      return on(parentScope, scope, name)
  }
}