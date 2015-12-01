import { keys, onKey } from './keys'

view Menu {
  let active = false
  let top, left

  on.event('contextmenu', e => {
    const mode = keys.alt
    if (!mode) return

    e.preventDefault()

    const { clientX, clientY } = e

    left = clientX
    top = clientY
    active = true
  })

  let focusElement = () => {
    _DT.messageEditor({ type: 'focus:element', key: __activeEl.key, view: __activeEl.view })
  }

  let focusStyle = () => {
    _DT.messageEditor({ type: 'focus:style', el: __activeEl.el, view: __activeEl.view })
  }


  on.click(window, e => {
    if (active) {
      e.stopPropagation()
      e.preventDefault()
      active = false
    }
  })

  <menu class={{ internal: true, active }}>
    <item class="internal" onClick={focusElement}>Edit Element</item>
    <item class="internal" onClick={focusStyle}>Edit Style</item>
  </menu>

  $menu = {
    borderRadius: 5,
    border: '1px solid #ddd',
    boxShadow: '0 0 10px rgba(0,0,0,0.2)',
    position: 'fixed',
    top,
    left,
    background: '#fff',
    zIndex: 2147483647,
    transition: 'opacity ease-in 30ms, transform ease-in 30ms',
    opacity: 0,
    transform: { y: -10 },
    pointerEvents: 'none',
    padding: 0
  }

  $active = {
    pointerEvents: 'auto',
    opacity: 1,
    transform: { y: 0 }
  }

  $item = {
    padding: [4, 8],
    minWidth: 120,
    cursor: 'pointer',

    hover: {
      background: [0,0,0,0.1]
    }
  }
}
