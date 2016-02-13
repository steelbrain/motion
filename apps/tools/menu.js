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
    if (keys.alt && keys.command) {
      document.body.classList.add('__motionfocus')
      focused = true
    }
  })
  on.keyup(() => {
    if (focused) {
      document.body.classList.remove('__motionfocus')
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

  function focusElement(el) {
    return function() {
      toEditor({ type: 'focus:element', key: el.key, view: el.view })
    }
  }

  function focusStyle(el) {
    return function() {
      toEditor({ type: 'focus:style', el: el.el, view: el.view })
    }
  }

  <menu class={{ internal: true, active }}>
    <item
      repeat={elements.filter(i => !!i.view)}
      class={{
        first: _index == 0,
        last: _index == elements.length - 1
      }}
    >
      <main class="hl" onClick={focusElement(_)}>{_.view}</main>
      <sub class="hl" onClick={focusStyle(_)}>$</sub>
    </item>
  </menu>

  const rad = 5

  $menu = {
    borderRadius: rad,
    border: '1px solid #ddd',
    boxShadow: '0 0 10px rgba(0,0,0,0.2)',
    position: 'absolute',
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
    minWidth: 120,
    cursor: 'pointer',
    flexFlow: 'row',
  }

  $first = {
    borderTopLeftRadius: rad,
    borderTopRightRadius: rad,
    overflow: 'hidden'
  }

  $last = {
    borderBottomLeftRadius: rad,
    borderBottomRightRadius: rad,
    overflow: 'hidden'
  }

  $hl = {
    padding: [4, 8],

    hover: {
      background: [0,0,0,0.1]
    }
  }

  $main = {
    flexGrow: 1
  }
}
