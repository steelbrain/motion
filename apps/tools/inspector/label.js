view Label {
  let focus, newVal

  const onFocus = e => {
    focus = true
    e => e.target.select()
  }

  const onBlur = e => {
    focus = false
  }

  <input
    defaultValue={String(view.props.val)}
    sync={newVal}
    class={{ focus }}
    size={Math.max(4, view.props.val.length)}
    spellCheck={false}
    onClick={e => e.stopPropagation()}
    onFocus={onFocus}
    onBlur={onBlur}
    onEnter={view.props.onSet.partial(newVal)}
  />

  $input = {
    position: 'absolute',
    top: 0,
    left: -1,
    right: 0,
    padding: 1,
    background: '#111',
    outline: 'none',
    border: 'none',
    opacity: 0,
    boxShadow: '1px 1px 4px rgba(0,0,0,0.8)'
  }

  $focus = {
    opacity: 1
  }
}