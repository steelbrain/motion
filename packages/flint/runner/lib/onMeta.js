import bridge from '../bridge'
import cache from '../cache'
import exec from './exec'

type Meta = {
  file: string;
  views: {
    location: Location;
    file: string;
    styles: {};
    els: {}
  }
}

let meta: Meta = {}

export default function setMeta({ file, views }) {
  cache.setFileMeta(file, views)
  bridge.broadcast('file:meta', { file, views })
  Object.keys(views).map(view => {
    meta[view] = views[view]
  })
}

// send messages for view adds and deletes
// cache.onAddView(view => bridge.message('view:add', { view, meta: meta[view] }))
// cache.onDeleteView(view => bridge.message('view:delete', { view, meta: meta[view] }))


bridge.onMessage('editor', ({ type, key, el, view }) => {
  if (type.substr(0, 6) != 'focus:') return

  if (view === undefined) return
  // the browser turns One.Two into One-Two
  view = view.replace(/\-/, '.')

  if (!meta[view]) return

  const data = meta[view].data

  if (data) {
    const viewData = { name: view, file: data.file }

    if (type == 'focus:style') {
      bridge.broadcast('editor:style', {
        view: viewData,
        position: meta[view].styles[el]
      }, 'focus')
    }

    if (type == 'focus:element') {
      if (!view || !key) return
      bridge.broadcast('editor:element', {
        view: viewData,
        position: meta[view].els[key]
      }, 'focus')
    }
  }

  //todo dont focus escape every time
  exec(`osascript -e 'activate application "Atom"'`)
})
