view Tree {
  let query = ''

  const search = q => query === '' || ^validateQuery(query) ? query = q : false
  const getOriginal = path => lens(^data, path)

  <Leaf
    data={^data}
    onClick={^onClick}
    id={^id}
    getOriginal={getOriginal}
    query={query}
    label="root"
    root={true}
    validateQuery={query => query.length >= 2}
    isExpanded={^isExpanded || () => false}
    interactiveLabel={^interactiveLabel}
    onSet={(...args) => view.props.onSet(args)}
  />

  $ = {
    pointerEvents: 'auto',
    marginLeft: -10
  }
}