view Inspector.Section {
  let open = true
  
  <bar onClick={() => open = !open}>
    <arrow class={{closed:!open}}>{open ? "▼" : "▶"}</arrow>
    <title>{view.props.title}</title>
  </bar>
  <body if={open}>{view.props.children}</body>
  
  
  const bg = 230
  const border = '1px solid rgba(0,0,0,.2)'
  
  $bar = {
    background: `rgba(${bg}, ${bg}, ${bg}, 1)`,
    borderTop: border, borderBottom: border,
    padding: [2, 5],
    flexFlow: 'row',
  }
  
  $title = { 
    marginLeft: 6,
    fontWeight: 500,
  }
  
  $arrow = {opacity: 0.6}
  $closed = { transform: { scale: 0.8 }, marginTop: 1}
  
  $body = { padding: [3, 12] }
}