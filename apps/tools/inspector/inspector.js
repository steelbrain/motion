// shouldComponentUpdate: function (p, s) {
//     return s.query !== state.query ||
//         ^data !== ^data ||
//         ^onClick !== ^onClick;
// },

view Inspector {
  let data, onClick, validateQuery, isExpanded
  let query = ''

  const search = q => query === '' || ^validateQuery(query) ? query = q : false
  const getOriginal = path => lens(^data, path)

  on('props', () => {
     { data, onClick, validateQuery, isExpanded } = view.props
  })

  on('mount', () => {
    createFilterer(^data, ^filterOptions)
    createFilterer(^data, ^filterOptions)
  })

  <Leaf
    data={data}
    onClick={^onClick}
    id={^id}
    getOriginal={getOriginal}
    query={s.query}
    label={'root'}
    root={true}
    isExpanded={^isExpanded}
    interactiveLabel={^interactiveLabel}
  />
}