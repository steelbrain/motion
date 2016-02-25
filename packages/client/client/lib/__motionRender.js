export default function(visual) {
  this.__motion.renders = 0
  let dom = []

  for (let i = 0; i < visual.length; i++) {
    let item = visual[i]

    if (typeof item == 'function') {
      this.__motion.renders++
      dom.push(item)
    }
    else {
      // apply styles to class
      Object.assign(this.__motion.styles, item)
    }
  }

  // dom will fetch styles

  dom = dom.map(d => d(this))

  if (dom.length > 1)
    return <div>{dom}</div>
  else
    return dom[0]
}