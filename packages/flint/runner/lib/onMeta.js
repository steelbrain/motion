import bridge from '../bridge'
import cache from '../cache'
import exec from './exec'

let meta = {}

bridge.on('editor', data => {
  let { type, key, el, view } = data

  if (type.substr(0, 6) != 'focus:') return

  if (view === undefined) return
  // the browser turns One.Two into One-Two
  view = view.replace(/\-/, '.')

  if (!meta[view]) return

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

export default ({ file, views }) => {
  cache.setFileMeta(file, views)

  Object.keys(views).map(view => {
    meta[view] = views[view]
  })
}
