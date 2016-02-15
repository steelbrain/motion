let browser;

const browserData = data => {
  browser.data = data;
}

// this is for using in runview
function motionRuntimeError(message, file, line, col, error) {
  browserData({ message, file, line, col, stack: error && error.stack });
  // console.log('got err', message, file, line, col, error)
  browser.emitter.emit('runtime:error')
}

window.motionRuntimeError = motionRuntimeError

export default function run(b, opts) {
  browser = b;

  window.onViewLoaded = () =>
    browserData('success', null);
}

export function compileError(error) {
  if (error.loc) {
    const { message, fileName, loc, stack } = error;
    browserData({ message, stack, file: fileName, line: loc.line, col: loc.column });
  }
  else if (error.lineNumber) {
    const { message, stack, fileName, lineNumber, column } = error;
    browserData({ message, stack, file: fileName, line: lineNumber, col: column });
  }
}

export function compileSuccess() {
  browserData(null);
}