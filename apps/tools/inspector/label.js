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
  
  let tabIndex = editable => editable ? {} : {tabIndex: 5000, disabled: true}

  <input
    defaultValue={String(view.props.val)}
    sync={newVal}
    class={{ focus }}
    size={Math.max(4, view.props.val.length)}
    spellCheck={false}
    onClick={e => e.stopPropagation()}
    onFocus={onFocus}
    onEnter={onBlur}
    onBlur={onBlur}
    onChange={onChange}
    {...tabIndex(view.props.editable)}
  />

  $input = {
    position: 'absolute',
    top: 0,
    background: 'yellow',
    left: -1,
    right: 0,
    padding: 1,
    outline: 'none',
    border: 'none',
    opacity: 0,
    boxShadow: '1px 1px 4px rgba(0,0,0,0.8)'
  }

  $focus = {
    opacity: 1
  }
}