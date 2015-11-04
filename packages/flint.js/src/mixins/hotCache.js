import phash from '../lib/phash'

export default function hotCache({ Internal, options }) {
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

      this.path = (this.context.path || '') + ',' + name + '.' + propsHash
    },

    set(name, val, postfix) {
      const path = this.getPath()
      if (!Internal.getCache[path]) Internal.getCache[path] = {}
      // undo postfix
      if (postfix) val = val + (postfix == '++' ? 1 : -1)

      Internal.setCache(path, name, val)

      if (this.shouldReRender())
        this.forceUpdate()
    },

    get(name, val, where) {
      // file scoped stuff always updates
      if (options.unchanged && where == 'fromFile')
        return val

      let result
      const path = this.getPath()

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

      const cacheVal = Internal.getCache[path][name]
      const cacheInitVal = Internal.getCacheInit[path][name]

      let originalValue, restore

      // if edited
      if (options.changed) {
        console.log('changed', isComparable, cacheInitVal, val)
        // initial value not undefined
        if (typeof cacheInitVal != 'undefined') {
          // only hot update changed variables
          //if (isComparable && cacheInitVal === val) {
          if (typeof val != 'function' && JSON.stringify(cacheInitVal) == JSON.stringify(val)) {
            restore = true
            originalValue = Internal.getCache[path][name]
          }
          //}
        }

        Internal.getCacheInit[path][name] = val
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
        
        console.log('return', restore, result)

      return result
    }
  }
}