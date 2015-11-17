import React from 'react'

export default function LastWorkingMainFactory(Internal) {
  return React.createClass({
    render() {
      debugger
      return Internal.lastWorkingRenders.Main
    }
  })
}