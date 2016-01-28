import equal from 'deep-equal'
import clone from 'clone'

export default function hotCache({ Internal, options, name }) {
  return {
    // on assign, result = val after mutation, use that instead of val
    set(name, val, result, useResult) {
      if (process.env.production) return val

      const path = this.props.__flint.path
      Internal.getCache[path] = Internal.getCache[path] || {}
      Internal.setCache(path, name, useResult ? result : val)
      return val
    },

    // on declaration
    dec(name, val, where) {
      this.state[name] = val
      return this.get(name, val, where)
    },

    // on access
    get(name, val, where) {
      if (process.env.production)
        return val

      const path = this.props.__flint.path

      // Inspector setting new state, prevent infinite loop
      if (_Flint.inspectorRefreshing === path)
        return Internal.getCache[path][name]

      // file scoped stuff always updates
      if (options.unchanged && where == 'fromFile')
        return val

      let result

      // setup caches
      if (!Internal.getCache[path])
        Internal.getCache[path] = {}
      if (!Internal.getCacheInit[path])
        Internal.getCacheInit[path] = {}

      const isComparable = (
        typeof val == 'number' ||
        typeof val == 'string' ||
        typeof val == 'boolean' ||
        typeof val == 'undefined' ||
        val === null
      )

      const checkDeep = true

      const cacheVal = Internal.getCache[path][name]
      const cacheInitVal = Internal.getCacheInit[path][name]

      let originalValue, restore

      function onEq() {
        restore = true
        originalValue = Internal.getCache[path][name]
      }

      // if edited
      if (options.changed) {
        // initial value not undefined
        if (typeof cacheInitVal != 'undefined') {
          // only hot update changed variables
          if (isComparable) {
            if (cacheInitVal === val)
              onEq()
          }
          else {
            if (typeof val == 'object' && checkDeep && equal(cacheInitVal, val))
              onEq()
          }
        }

        Internal.getCacheInit[path][name] = clone(val)
      }

      // set changed cache val
      if (options.changed && typeof cacheVal == 'undefined')
        Internal.setCache(path, name, val)

      // return cached
      if (isComparable)
        if (options.unchanged && cacheVal !== cacheInitVal)
          result = cacheVal

      if (!result)
        result = restore ? originalValue : val

      return result
    }
  }
}