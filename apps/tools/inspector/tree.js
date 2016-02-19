import lens from '../lib/lens'

view Tree {
  prop data, id, editable, isExpanded, interactiveLabel
  prop onEdit = () => {}, onSet = () => {}, validateQuery = () => {}
  let query = ''

  const search = q => query === '' || validateQuery(query) ? query = q : false
  const getOriginal = path => lens(data, path)

  <Leaf {...({ data, onEdit, id, getOriginal,
              query, editable, isExpanded, })}
        onSet={onSet}
        label="root"
        root={true}
        validateQuery={query => query.length >= 2}
  />

  $ = {
    pointerEvents: 'auto',
    marginLeft: -10
  }
}
