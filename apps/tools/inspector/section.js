view Inspector.Section {
  let open = true

  <Inspector.Title onToggle={val => open = val}>
    {view.props.title}
  </Inspector.Title>
  <body>
    {view.props.children}
  </body>

  $ = {
    padding: [0, 0, 5]
  }

  $body = {
    padding: [0, 12]
  }

  $inactive = {
    display: 'none'
  }
}