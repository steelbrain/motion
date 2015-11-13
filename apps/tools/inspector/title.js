view Inspector.Title {
  let open = true

  if (view.props.onToggle)
    on.click(toggle)

  function toggle() {
    open = !open
    view.props.onToggle(open)
  }

  <inner>{view.props.children}</inner>

  $ = {
    fontWeight: 300,
    borderBottom: '1px solid #eee',
    height: 10,
    margin: [5, 0, 3],
    color: '#999',
    flexFlow: 'row',
  }

  $closed = {
    transform: { scale: 0.8 },
    marginTop: 1
  }

  $inner = {
    padding: [4, 10],
    background: '#fff',
    margin: [-1, 'auto']
  }
}