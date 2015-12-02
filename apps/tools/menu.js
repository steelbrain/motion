import { keys, onKey } from './keys'
import inspecting from './lib/inspecting'

const Tools = _DT
const toEditor = Tools.messageEditor

view Menu {
  let active = false
  let top, left
  let elements = []

  // prevent select and show custom cursor when ready for context
  let focused
  on.keydown(() => {
    console.log(keys)
    if (keys.alt && keys.command) {
      document.body.classList.add('__flintfocus')
      focused = true
    }
  })
  on.keyup(() => {
    if (focused) {
      document.body.classList.remove('__flintfocus')
      focused = false
    }
  })

  on.click(window, e => {
    if (active) {
      e.stopPropagation()
      e.preventDefault()
      active = false
      return
    }

    const mode = keys.alt && keys.command
    if (!mode) return

    e.preventDefault()

    const { clientX, clientY } = e

    left = clientX
    top = clientY
    active = true
    elements = inspecting.all()
  })

  function focusElement() {
    toEditor({ type: 'focus:element', key: __activeEl.key, view: __activeEl.view })
  }

  function focusStyle() {
    toEditor({ type: 'focus:style', el: __activeEl.el, view: __activeEl.view })
  }

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
