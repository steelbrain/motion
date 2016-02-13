let el
let reactKey = null
let getReactKey = el =>
  Object.keys(el).filter(k => k.indexOf('__reactInternalInst')==0)[0]

function getReactId(el) {
  if (!reactKey) reactKey = getReactKey(el)
  if (!el[reactKey]) return
  let current = el[reactKey]._currentElement
  if (!current || !current.key) return null

  let key = current.key
  let split = key.split('$')
  return split[split.length - 1]
}

const Inspecting = {
  set(_) {
    el = _
  },

  get() {
    return el
  },

  props(el) {
    return {
      key: getReactId(el),
      el: el.tagName.toLowerCase(),
      view: el.className
        .split(' ')
        .filter(s => s.substr(0,4) != 'View')
        .filter(s => s.charAt(0).toUpperCase() == s.charAt(0))[0]
    }
  },

  all() {
    let cur = el
    let parents = [this.props(cur)]

    // walk upwards, find unique views
    while (cur.parentNode && cur.parentNode.tagName) {
      let parent = cur.parentNode
      let last = parents[parents.length - 1]
      let next = this.props(parent)

      if (next.view && next.view != last.view) {
        // filter __motionfocus
        if (next.view[0] != '_') {
          parents.push(next)
        }
      }

      cur = parent
    }

    return parents
  }
}

export default Inspecting
