import bridge from '../bridge'

let meta = {}

let focusEl = data => {
  console.log('in focus el')
  //console.log('data ', data.view, data.key)
  //bridge.message('focus:element', { data })
}

let focusStyle = data => {
  console.log('in focus style')
  //console.log('data ', data.view, data.key)
}

bridge.on('editor', data => {
  const { type, key, el, view } = data

  if (type == 'focus:style') {
    bridge.message('editor:style', { view, position: meta[view].styles[el] }, 'focus')
  }

  if (type == 'focus:element') {
    if (!view || !key) return
    bridge.message('editor:element', { view, position: meta[view].els[key] }, 'focus')
  }
})

export default ({ viewMeta }) => {
  Object.keys(viewMeta).map(view => {
    meta[view] = viewMeta[view]
  })
}
