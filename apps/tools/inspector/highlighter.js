const isEmpty = obj => Object.keys(object).length === 0

view Highlighter {
  <name if={!^highlight || ^string.indexOf(^highlight) === -1}>
    {^string}
  </name>
  <span if={^highlight}>
    <span repeat={^string.split()}>
      <highlight if={_index > 0}>{^highlight}</highlight>
      {_}
    </span>
  </span>
}