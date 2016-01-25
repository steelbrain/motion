import React from 'flint-react'

export default React.createClass({
  render() {
    const errorStyle = {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      padding: '10% 0',
      color: '#999',
      zIndex: 10000,
      textAlign: 'center'
    };

    return (
      <div style={errorStyle}>
        There was an error compiling your Main view.
      </div>
    );
  }
})