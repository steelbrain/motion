view Label {
  let focus

  const onFocus = e => {
    focus = true
    e => e.target.select()
  }

  const onBlur = e => {
    focus = false
  }

  <input
    defaultValue={String(^val)}
    class={{ focus }}
    size={Math.max(1, ^val.length)}
    spellCheck={false}
    onClick={e => e.stopPropagation()}
    onFocus={onFocus}
    onBlur={onBlur}
  />

  $input = {
    position: 'absolute',
    top: 0,
    left: -1,
    right: 0,
    padding: 1,
    background: '#fff',
    font: 'Consolas, monospace',
    outline: 'none',
    border: 'none',
    opacity: 0,
    boxShadow: '1px 1px 4px rgba(0,0,0,0.25)'
  }

  $focus = {
    opacity: 1
  }
}