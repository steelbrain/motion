view FlintModal {
  prop open, title, children

  let lastTitle

  on.props(() => {
    lastTitle = title || lastTitle
  })

  <Close size={25} />
  <title if={lastTitle}>{lastTitle}</title>
  <message if={children}>{children}</message>

  $ = {
    position: 'fixed',
    top: open ? 0 : -140,
    right: 0,
    minWidth: 80,
    padding: [7, 5],
    margin: 20,
    background: '#fff',
    boxShadow: '0 5px 26px rgba(0,0,0,0.13)',
    border: '1px solid #dadada',
    fontSize: 14,
    transition: 'all ease-in 200ms',
    textAlign: 'center',
    borderRadius: 6,
    pointerEvents: 'auto'
  }

  $title = {
    color: view.props.titleColor || '#222',
    fontWeight: 500,
    fontSize: 15,
    margin: [0, 20]
  }

  $message = {
    fontFamily: "-apple-system, 'Helvetica Nueue', Helvetica, Arial, sans-serif",
  }
}
