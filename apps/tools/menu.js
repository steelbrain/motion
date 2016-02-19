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

  on.event('contextmenu', e => {
    const mode = keys.alt && keys.command
    if (!mode) return

    e.preventDefault()

    const { clientX, clientY } = e

    left = clientX
    top = clientY - 18
    active = true
    elements = inspecting.all()
  })

  on.click(window, e => {
    if (active) {
      e.stopPropagation()
      e.preventDefault()
      active = false
      return
    }
  })

  function focusElement(el) {
    return function() {
      // slicing because h11 -> h1
      toEditor({ type: 'focus:element', key: el.key.slice(0, -1), view: el.view })
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
      <toEl class="hl" onClick={focusElement(_)}>{_.view.replace(/\-/g, '.')}</toEl>
      <toStyle class="hl">
        <Dollar onClick={focusStyle(_)}/>
      </toStyle>
    </item>
  </menu>

  const rad = 2

  $menu = {
    borderRadius: rad,
    border: '1px solid #ddd',
    boxShadow: '0 2px 2px rgba(0,0,0,0.1)',
    position: 'absolute',
    top,
    left,
    background: '#fcfcfc',
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

  $Dollar = {
    marginTop: 2,
    opacity: 0.8,
  }

  $item = {
    borderTop: _index === 0 ? undefined : '1px solid rgba(0,0,0,0.1)',
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
    padding: [8, 8],
    hover: {
      background: [0,0,0,0.05]
    }
  }

  $sub = {
    marginTop: 5,
    marginLeft: 0,
    fontSize: 13,
  }

  $toStyle = {
    hover: {
      borderLeft: '1px solid rgba(0,0,0, 0.1)',
    }
  }

  $toEl = {
    flexGrow: 1,
    hover: {
      fontSize: 30,
      borderRight: '1px solid rgba(0,0,0, 0.1)',
    }
  }
}
