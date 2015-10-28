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
    key={Math.random()}
    size={Math.max(1, ^val.length)}
    spellCheck={false}
    onClick={e => e.stopPropagation()}
    // onFocus={onFocus}
    // onBlur={onBlur}
  />

  $input = {
    position: 'absolute',
    top: -1,
    left: -3,
    right: 0,
    padding: [0, 3],
    font: 'Consolas, monospace',
    outline: 'none',
    border: '1px solid #ddd',
    opacity: 1
  }

  $focus = {
    opacity: 1
  }
}