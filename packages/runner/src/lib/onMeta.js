import bridge from '../bridge'
import exec from './exec'

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
  let { type, key, el, view } = data

  if (type.substr(0, 6) != 'focus:') return

  if (view === undefined) return
  // the browser turns One.Two into One-Two
  view = view.replace(/\-/, '.')

  const viewData = { name: view, file: meta[view].data.file }

  if (type == 'focus:style') {
    bridge.message('editor:style', {
      view: viewData,
      position: meta[view].styles[el]
    }, 'focus')
  }

  if (type == 'focus:element') {
    if (!view || !key) return
    bridge.message('editor:element', {
      view: viewData,
      position: meta[view].els[key]
    }, 'focus')
  }

  //todo dont focus escape every time
  exec(`osascript -e 'activate application "Atom"'`)
})

export default data => {
  Object.keys(data.meta).map(view => {
    meta[view] = data.meta[view]
  })
}
