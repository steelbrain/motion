view Inspector.Section {
  let open = true

  <Inspector.Title onToggle={val => open = val}>
    {view.props.title}
  </Inspector.Title>
  <body>
    {view.props.children}
  </body>

  $ = {
    padding: [5, 0]
  }

  $body = {
    padding: [0, 12]
  }

  $inactive = {
    display: 'none'
  }
}