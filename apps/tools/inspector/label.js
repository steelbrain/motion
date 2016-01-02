view Label {
  let input = null
  let focus, newVal

  on.props(() => {
    newVal = view.props.val
  })

  const onFocus = e => {
    if (!view.props.editable) return
    focus = true
    e.stopPropagation()
    e.target.select()
  }

  const onBlur = e => {
    focus = false
  }

  const onChange = e => {
    newVal = e.target.value

    // todo: debate
    if (newVal === 'false') newVal = false
    if (newVal === 'true') newVal = true
    view.props.onSet(newVal)
  }

  let tabIndex = editable => editable ? {} : {tabIndex: 5000, disabled: true}

  <input
    defaultValue={String(view.props.val)}
    sync={newVal}
    class={{ focus }}
    size={Math.max(4, view.props.val && view.props.val.length || 0)}
    spellCheck={false}
    onMouseUp={onFocus}
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
    width: 140,
    outline: 'none',
    border: 'none',
    opacity: 0,
    boxShadow: '1px 1px 2px rgba(0,0,0,0.4)'
  }

  $focus = {
    opacity: '1 !important',
  }
}