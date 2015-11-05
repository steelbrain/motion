import phash from '../lib/phash'
import equal from 'deep-equal'
import clone from 'clone'

export default function hotCache({ Internal, options, name }) {
  if (process.env.production)
    return {
      get(name, val) { return val },
      set() { this.shouldReRender() && this.forceUpdate() }
    }

  return {
    childContextTypes: {
      path: React.PropTypes.string
    },

    contextTypes: {
      path: React.PropTypes.string
    },

    getChildContext() {
      return { path: this.getPath() }
    },

    getPath() {
      if (!this.path) this.setPath()
      return `${this.path}-${this.props.__key || ''}`
    },

    setPath() {
      let propsHash

      // get the props hash, but lets cache it so its not a ton of work
      if (options.changed === true) {
        propsHash = phash(this.props)
        Internal.propsHashes[this.context.path] = propsHash
        options.changed = 2
      }
      else if (!propsHash) {
        propsHash = Internal.propsHashes[this.context.path]

        if (!propsHash) {
          propsHash = phash(this.props)
          Internal.propsHashes[this.context.path] = propsHash
        }
      }

      const sep = name == 'Main' ? '' : ','
      this.path = (this.context.path || '') + sep + name + '.' + propsHash
    },

    // result = val after mutation, use that instead of val
    set(name, val, result, useResult) {
      const path = this.getPath()
      if (!Internal.getCache[path]) Internal.getCache[path] = {}

      Internal.setCache(path, name, useResult ? result : val)

      if (this.shouldReRender())
        this.forceUpdate()
    },

    get(name, val, where) {
      const path = this.getPath()
      
      if (_Flint.inspectorRefreshing) return Internal.getCache[path][name]
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