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
    left: -3,
    right: 0,
    padding: [0, 2],
    font: 'Consolas, monospace',
    outline: 'none',
    border: '1px solid #ddd',
    opacity: 0,
    boxShadow: '1px 1px 4px rgba(0,0,0,0.5)'
  }

  $focus = {
    opacity: 1
  }
}