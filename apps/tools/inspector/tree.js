view Tree {
  let query = ''

  const search = q => query === '' || view.props.validateQuery(query) ? query = q : false
  const getOriginal = path => lens(view.props.data, path)

  <Leaf
    data={view.props.data}
    onClick={view.props.onClick}
    id={view.props.id}
    getOriginal={getOriginal}
    query={query}
    label="root"
    root={true}
    validateQuery={query => query.length >= 2}
    isExpanded={view.props.isExpanded || () => false}
    interactiveLabel={view.props.interactiveLabel}
    onSet={(...args) => view.props.onSet(args)}
  />

  $ = {
    pointerEvents: 'auto',
    marginLeft: -10
  }
}