import { keys, onKey } from './keys'

view Menu {
  on.event('contextmenu', e => {
    const active = keys.alt
    if (!active) return

    e.preventDefault()

    const { pageX, pageY } = e

    console.log(pageX, pageY)
  })

  <item>Show ...</item>
  <item>Show ...</item>
  <item>Show ...</item>

  $ = {
    borderRadius: 5,
    border: '1px solid #ddd',
    boxShadow: '0 0 10px rgba(0,0,0,0.2)',
    position: 'fixed',
    background: '#fff',
    zIndex: 2147483647
  }

  $item = {
    padding: [2, 8],
    minWidth: 120,

    hover: {
      background: [0,0,0,0.1]
    }
  }
}
