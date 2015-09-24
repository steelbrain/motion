import React from 'react'

export default React.createClass({
  render() {
    const errorStyle = {
      background: 'red',
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      padding: '40% 20%',
      color: '#fff',
      textAlign: 'center'
    };

    return (
      <div style={errorStyle}>
        There was an error compiling your Main view.
      </div>
    );
  }
})