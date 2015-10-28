view Modal {
  view.pause()

  let children, title, open

  on('props', setMessage)

  function setMessage() {
    open = ^open

    // cache last children when empty
    if (title && !^title)
      return view.update()

    title = ^title
    children = ^children
    view.update()
  }

  <modal>
    <close onClick={^onClose}>X</close>
    <title if={title}>{title}</title>
    <message if={children}>{children}</message>
  </modal>

  $ = {
    position: 'fixed',
    top: open ? 0 : -140,
    left: 0,
    minWidth: 80,
    padding: [10, 10],
    margin: 20,
    background: '#fff',
    boxShadow: '0 0 20px rgba(0,0,0,0.05)',
    border: '1px solid #dfdfdf',
    borderTop: '2px solid crimson',
    fontSize: 13,
    transition: 'all ease-in 200ms',
    textAlign: 'center',
    borderRadius: 6,
    pointerEvents: 'auto'
  }

  $title = {
    color: '#222',
    fontWeight: 500,
    fontSize: 15,
    margin: [0, 20]
  }

  $message = {
    fontFamily: "-apple-system, 'Helvetica Nueue', Helvetica, Arial, sans-serif",
  }

  $close = {
    position: 'absolute',
    top: 0,
    left: 0,
    background: '#eee',
    color: 'red',
    fontSize: 11,
    fontWeight: 100,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    borderRadius: 7,
    border: '3px solid #fff',
    opacity: 0.2,
    transition: 'all ease-in 200ms',

    ':hover': {
      opacity: 1
    }
  }
}