import React from 'flint-react'

export default function LastWorkingMainFactory(Internal) {
  return React.createClass({
    render() {
      return Internal.lastWorkingRenders.Main
    }
  })
}