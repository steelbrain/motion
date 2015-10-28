const isEmpty = obj => Object.keys(object).length === 0

view Highlighter {
  <span if={!^highlight || ^string.indexOf(^highlight) === -1}>
    {^string}
  </span>
  <span>
    <span repeat={^highlight}>
      <highlight if={_index > 0}>{^highlight}</highlight>
      {_}
    </span>
  </span>
}