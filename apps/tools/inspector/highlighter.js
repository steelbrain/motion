const isEmpty = obj => Object.keys(object).length === 0

view Highlighter {
  <name if={!view.props.highlight || view.props.string.indexOf(view.props.highlight) === -1}>
    {view.props.string}
  </name>
  <span if={view.props.highlight}>
    <span repeat={view.props.string.split()}>
      <highlight if={_index > 0}>{view.props.highlight}</highlight>
      {_}
    </span>
  </span>
}