view Inspector {
  let filterer
  let query = ''

  const search = q => query === '' || ^validateQuery(query) ? query = q : false
  const getOriginal = path => lens(^data, path)

  on('mount', () => {
    filterer = createFilterer(^data, ^filterOptions)
  })

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
  />

  $ = {
    pointerEvents: 'auto',
    fontFamily: 'Consolas, monospace'
  }
}