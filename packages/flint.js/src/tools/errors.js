import unflint from '../lib/unflint'

let browser = window;

const browserData = data => {
  browser.data = data;
}

// this is for using in runview
const flintRuntimeError = window.flintRuntimeError =
  (message, file, line, col, error) => {
    console.log('got runtime error')
    browserData({ message, file, line, col, stack: error.stack });
    browser.emitter.emit('runtime:error')
  }

export default function run(b, opts) {
  browser = b;

  window.onViewLoaded = () =>
    browserData('success', null);
}

export function compileError(error) {
  console.log('compile error', unflint(error.stack))
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
