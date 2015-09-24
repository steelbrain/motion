import React from 'react';

export default class ErrorDefinedTwice {
  render() {
    return (
      <div>
        Error! You've defined this view twice in your codebase.
        Check your code for multiple definitions and resolve!
      </div>
    )
  }
}
