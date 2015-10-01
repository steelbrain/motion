function flintRun_tools(node, opts, cb) {
  var FlintInstace = opts.Flint || runFlint;
  var Flint = FlintInstace(node, opts, cb);

  (function(Flint) {
    (function(global, exports) {
  var FlintFile = '/Users/nw/flint/apps/tools/Main.js'; Flint.startHot(FlintFile);'use strict';

var split = function split(s, i) {
  return [s.substring(0, i), s.substring(i, i + 1), s.substring(i + 1)];
};

var niceRuntimeError = function niceRuntimeError(err) {
  (view.update(), err.niceMessage = err.message.replace(/Uncaught .*Error:\s*/, '').replace(/\_vars\./g, String.fromCharCode('64')));
  return err;
};

var niceCompilerMessage = function niceCompilerMessage(err) {
  (view.update(), err.niceMessage = err.message.replace(err.file + ': ', '').replace(/identifier ([a-z]*)\s*Unknown global name/, '$' + '1 is not defined').replace(/\([0-9]+\:[0-9]+\)/, '').replace(/Line [0-9]+\:\s*/, ''));
  return err;
};

var niceStack = function niceStack(err) {
  if (err.stack) {
    err.stack.split("\n").forEach(function (line) {
      if (line[0] === '>') {
        (view.update(), err.niceStack = line.replace('const ', '').replace(/Flint.([a-zA-Z]*)Wrapper/g, '$' + '1').replace(/\_vars\./g, String.fromCharCode('64')).replace(/\>\s*[0-9]+\s*\|\s*/, ''));

        var colIndex = err.col - 1;
        (view.update(), err.niceStack = split(err.niceStack, colIndex));
      }
    });
  }
  return err;
};

Flint.view("Main", "134697684", function (view, on) {
  var error = null;
  var compileError = null;
  var runtimeError = null;
  var errDelay = null;

  /* only set error if there is an error,
     giving compile priority */
  var setError = function setError() {
    clearTimeout(errDelay);
    var noErrors = !compileError && !runtimeError;

    if (noErrors) {
      (view.update(), error = null);
      return;
    }

    var delay = compileError ? 200 : 800;
    (view.update(), errDelay = setTimeout(function () {
      console.log('check errors', runtimeError, compileError);
      if (runtimeError) {
        console.log('runtime', niceRuntimeError(runtimeError));
        (view.update(), error = niceRuntimeError(runtimeError));
      }

      if (compileError) {
        console.log(niceStack(niceCompilerMessage(compileError)));
        (view.update(), error = niceStack(niceCompilerMessage(compileError)));
      }

      console.log('GOT ERROR', error);
    }, delay));
  };

  window._DT.on('compile:error', function () {
    console.log("compile error", window._DT.data);
    (view.update(), runtimeError = null);
    (view.update(), compileError = window._DT.data);
    setError();
  });

  window._DT.on('runtime:error', function () {
    // on multiple errors, prefer the first
    // if (runtimeError) return
    (view.update(), compileError = null);
    (view.update(), runtimeError = window._DT.data);
    console.log('set error!!!!!!!');
    setError();
  });

  window._DT.on('runtime:success', function () {
    (view.update(), runtimeError = null);
    setError();
  });

  window._DT.on('compile:success', function () {
    (view.update(), compileError = null);
    setError();
  });

  (view.update(), view.style["stylediv"] = function (_index) {
    return false || {
      position: 'absolute',
      top: 0, left: 0,
      width: '100%'
    };
  });
  return function () {
    return view.el(295, "Flint.MainWrapper", {view: view}, 
        view.el(296, "div", null, 
    "Error is: ", error, 
    console.log('in view >>>', error)
  ), 
  view.el(297, "ErrorMessage", {error: error})

      );
  };
});

Flint.view("ErrorMessage", "-2030256742", function (view, on) {
  var last = function last(arr) {
    return arr[arr.length - 1];
  };
  var fileName = function fileName(url) {
    return last(url.split('/'));
  };

  var devHeight = 0; // 34 with bar
  var closedHeight = 55;
  var openHeight = 200;

  var open = true;

  (view.update(), view.style["styleerror"] = function (_index) {
    return false || {
      background: '#fff',
      borderTop: '1px solid rgba(255,0,0,0.2)',
      position: 'fixed',
      left: 0,
      height: open ? openHeight : 'auto',
      bottom: view.props.error ? devHeight : devHeight - closedHeight,
      transition: 'all 300ms ease-in',
      right: 0,
      boxShadow: '0 0 40px rgba(0, 0, 0, 0.1) inset',
      fontFamily: 'helvetica',
      color: '#222',
      fontSize: 15,
      padding: 8,
      pointerEvents: 'all',
      overflow: 'scroll',
      zIndex: 2147483647
    };
  });

  (view.update(), view.style["styleinner"] = function (_index) {
    return false || {
      display: 'block'
    };
  });

  (view.update(), view.style["stylewhere"] = function (_index) {
    return false || {
      display: 'inline-block',
      fontSize: 15,
      pointerEvents: 'all',
      fontWeight: 'bold',
      color: '#C51E19'
    };
  });

  (view.update(), view.style["styleerrorTitle"] = function (_index) {
    return false || {
      display: 'inline'
    };
  });

  (view.update(), view.style["stylemsg"] = function (_index) {
    return false || {
      display: 'inline-block',
      fontSize: 16,
      fontWeight: 'bold',
      pointerEvents: 'all'
    };
  });

  (view.update(), view.style["styleniceStack"] = function (_index) {
    return false || {
      opacity: 0.65,
      display: 'inline',
      fontFamily: 'Meslo, Menlo, Monaco, monospace',
      fontSize: 14,
      padding: '0 10px'
    };
  });

  (view.update(), view.style["styleerrCol"] = function (_index) {
    return false || {
      display: 'inline',
      background: 'red',
      color: 'white'
    };
  });

  (view.update(), view.style["stylestack"] = function (_index) {
    return false || {
      fontFamily: 'monospace',
      fontSize: 14,
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      maxHeight: 200
    };
  });

  (view.update(), view.style["styleline"] = function (_index) {
    return false || {
      whiteSpace: 'pre',
      pointerEvents: 'all'
    };
  });

  (view.update(), view.style["styleboldline"] = function (_index) {
    return false || {
      whiteSpace: 'pre',
      pointerEvents: 'all',
      fontWeight: 'bold'
    };
  });
  return function () {
    return view.el(298, "Flint.ErrorMessageWrapper", {view: view}, 
        view.el(299, "error", null, 
    view.props.error && view.el(300, "inner", {if: view.props.error}, 
      view.el(301, "where", null, fileName(view.props.error.file), view.props.error.line && ' (L' + (view.props.error.line - 1) + ')'), 
      ' ', 
      view.el(302, "errorTitle", null, 
        view.props.error.niceMessage || view.props.error.message, 
        view.props.error.niceStack && view.el(303, "niceStack", null, 
            view.props.error.niceStack[0], 
            view.el(304, "errCol", null, view.props.error.niceStack[1]), 
            view.props.error.niceStack[2]
          )
      )
    )
  )

      );
  };
});

Flint.view("ErrorIcon", "1478709636", function (view, on) {

  (view.update(), view.style["stylesvg"] = function (_index) {
    return false || {
      width: 19,
      fill: 'red',
      margin: -4,
      marginLeft: 3,
      marginRight: 6,
      opacity: 0.9
    };
  });
  return function () {
    return view.el(305, "Flint.ErrorIconWrapper", {view: view}, 
        view.el(306, "svg", {viewBox: "0 0 27.963 27.963"}, 
    view.el(307, "path", {d: "M13.983,0C6.261,0,0.001,6.259,0.001,13.979c0,7.724,6.26,13.984,13.982,13.984s13.98-6.261,13.98-13.984\\n      C27.963,6.259,21.705,0,13.983,0z M13.983,26.531c-6.933,0-12.55-5.62-12.55-12.553c0-6.93,5.617-12.548,12.55-12.548\\n      c6.931,0,12.549,5.618,12.549,12.548C26.531,20.911,20.913,26.531,13.983,26.531z"}), 
    view.el(308, "polygon", {points: "15.579,17.158 16.191,4.579 11.804,4.579 12.414,17.158"}), 
    view.el(309, "path", {d: "M13.998,18.546c-1.471,0-2.5,1.029-2.5,2.526c0,1.443,0.999,2.528,2.444,2.528h0.056c1.499,0,2.469-1.085,2.469-2.528\\n      C16.441,19.575,15.468,18.546,13.998,18.546z"})
  )

      );
  };
});Flint.endHot(FlintFile);
  Flint.setExports(exports);
})(root, {});

    Flint.render()
  })(Flint);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = flintRun_tools
}