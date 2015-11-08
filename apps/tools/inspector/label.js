view Label {
  let focus, newVal

  const onFocus = e => {
    if (!view.props.editable) return
    focus = true
    e => e.target.select()
  }

  const onBlur = e => {
    focus = false
  }
  
  const onChange = e => {
    newVal = e.target.value
    view.props.onSet(newVal)
  }
  const select = e => {
    e.stopPropagation()
    view.refs.input.select()
  }
  
  let tabIndex = editable => editable ? {} : {tabIndex: 5000, disabled: true}

  <input
    defaultValue={String(view.props.val)}
    sync={newVal}
    class={{ focus }}
    ref="input"
    size={Math.max(4, view.props.val.length)}
    spellCheck={false}
    onClick={select}
    onFocus={onFocus}
    onEnter={onBlur}
    onBlur={onBlur}
    onChange={onChange}
    {...tabIndex(view.props.editable)}
  />

  $input = {
    position: 'absolute',
    top: 0,
    left: -1,
    right: 0,
    color: '#333',
    padding: 1,
    outline: 'none',
    border: 'none',
    opacity: 0,
    boxShadow: '1px 1px 2px rgba(0,0,0,0.4)'
  }

  $focus = {
    opacity: 1
  }
}