view Inspector.Section {
  let open = true

  <bar onClick={() => open = !open}>
    <arrow class={{closed:!open}}>{open ? "▼" : "▶"}</arrow>
    <title>{view.props.title}</title>
  </bar>
  <body if={open}>{view.props.children}</body>


  const bg = 250
  const border = 'none'

  $bar = {
    background: `rgba(${bg}, ${bg}, ${bg}, 1)`,
    borderTop: border, borderBottom: border,
    padding: [1, 5],
    flexFlow: 'row',
  }

  $title = {
    marginLeft: 4,
    fontWeight: 500,
    color: '#666'
  }

  $arrow = {
    opacity: 0.3,
    fontSize: 9,
    margin: ['auto', 0]
  }

  $closed = {
    transform: { scale: 0.8 },
    marginTop: 1
  }

  $body = {
    padding: [3, 12]
  }
}