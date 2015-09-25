function flintRun_tools(node, opts, cb) {
  var FlintInstace = opts.Flint || runFlint;
  var Flint = FlintInstace(node, opts, cb);

  (function(Flint) {
    /* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; "use strict";

                     Flint.defineView("Bar", "-2103129275", function _flintDefineView() {
    var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
    ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        return Flint.createElement(0.016908423975110054, "Flint.BarWrapper", _view, {view: "Bar"}, Flint.createElement(0.1790533463936299, "bar", _view, null, 
    Flint.createElement(0.7238076978828758, "overlay", _view, null), 
    _view.props.children
  )

        );
    };
    _view.styleFunctions["stylebar"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        return false || {
            maxHeight: 200,
            fontFamily: "Helvetica",
            position: "fixed",
            left: 0,
            right: 0,
            bottom: _view.props.hide ? -60 : 0,
            transition: "all ease-in 100ms",
            pointerEvents: "none",
            backgroundColor: "#fafafa",
            WebkitUserSelect: "none"
        };
    };

    _view.styleFunctions["styleoverlay"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        return false || {
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 0,
            opacity: 0.4
        };
    };return _view;
});
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; "use strict";

                        Flint.defineView("Button", "1048030815", function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.059366165893152356, "Flint.ButtonWrapper", _view, {view: "Button"}, Flint.createElement(0.8266110648401082, "Icon", _view, null, _view.props.icon), 
  _view.props.children && Flint.createElement(0.46229039900936186, "child", _view, {if: _view.props.children}, _view.props.children)

    );
  };
  _view.styleFunctions["style"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      flexFlow: "row",
      cursor: "pointer",
      fill: "currentColor",
      margin: "auto",
      flexGrow: 1,
      justifyContent: "center",
      color: "#000",
      padding: "2px 5px",
      transition: "opacity ease-in 100ms, transform ease-in 40ms",
      opacity: 0.9,

      ":hover": {
        color: "#000",
        textShadow: "0 -1px 0 #fff",
        opacity: 1,
        transform: "scale(1.05)"
      }
    };
  };

  _view.styleFunctions["stylechild"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      alignSelf: "center",
      padding: "0 5px",
      textTransform: "uppercase",
      fontSize: 11,
      fontWeight: 600
    };
  };return _view;
});
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; "use strict";

                         Flint.defineView("Console", "-172417184", function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  _view.set('value', _vars.value = "Console");

  var handleFocus = _view.handleFocus = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    if (_vars.value === "Console") _view.set('value', _vars.value = "");
  };
  var handleBlur = _view.handleBlur = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    if (_vars.value === "") _view.set('value', _vars.value = "Console");
  }; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.4779156637378037, "Flint.ConsoleWrapper", _view, {view: "Console"}, Flint.createElement(0.8919677413068712, "Arrow", _view, null), 
  Flint.createElement(0.7815481263678521, "input", _view, {value: _vars.value, onChange: function (e) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        _view.set('value', _vars.value = e.target.value);
      }, onFocus: handleFocus, onBlur: handleBlur})

    );
  };
  _view.styleFunctions["style"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      flexFlow: "row",
      flexGrow: 1,
      position: "relative"
    };
  };

  _view.styleFunctions["styleinput"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      flexGrow: 1,
      background: "none",
      border: "none",
      height: "100%",
      color: "#777",
      fontSize: 15,
      padding: "8px 0 9px 22px",
      fontFamily: "Source Code Pro, Menlo, Monaco, monospace",
      transition: "all ease-in 100ms",

      ":focus": {
        color: "#fff",
        background: "none"
      },

      ":hover": {
        background: "none",
        color: "#ccc"
      }
    };
  };return _view;
});

                              Flint.defineView("Console.Arrow", "290648663", function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.3275946262292564, "Flint.Console.ArrowWrapper", _view, {view: "Console.Arrow"}, Flint.createElement(0.2872089855372906, "svg", _view, {viewBox: "0 0 306 306"}, 
    Flint.createElement(0.11390051548369229, "polygon", _view, {points: "94.35,0 58.65,35.7 175.95,153 58.65,270.3 94.35,306 247.35,153"})
  )

    );
  };
  _view.styleFunctions["stylesvg"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      fill: "#888",
      zIndex: 1000,
      width: 12,
      height: 12,
      top: 12,
      left: 6,
      position: "absolute",
      opacity: 0.5,
      shapeRendering: "crispEdges"
    };
  };return _view;
});
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; "use strict";

                          Flint.defineView("Controls", "-375031597", function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.22132796584628522, "Flint.ControlsWrapper", _view, {view: "Controls"}, Flint.createElement(0.09292559581808746, "Group", _view, null, 
    Flint.createElement(0.8201563588809222, "Button", _view, {icon: Flint.createElement(0.5291562646161765, "Tree", _view, null)}, 
      "Inspect"
    )
  )

    );
  };
  _view.styleFunctions["styleGroup"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      padding: "0",
      marginTop: 5,
      borderLeft: "1px solid rgba(0,0,0,0.1)",
      justifyContent: "center"
    };
  };return _view;
});

                              Flint.defineView("Controls.Tree", "421431129", function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.282234814716503, "Flint.Controls.TreeWrapper", _view, {view: "Controls.Tree"}, Flint.createElement(0.2735277726314962, "svg", _view, {viewBox: "0 0 512 512"}, 
    Flint.createElement(0.9962596332188696, "path", _view, {d: "M447.146,273.504l-72.35-26.699V168.35l-35.597-14.02l-0.023-39.481L256,84.083l-83.196,30.43l-0.003,39.818l-35.597,14.02\n      v78.449l-72.38,26.403l0,107.837l83.199,31.905l47.447-18.195L256,424.55l60.522-29.796l47.436,18.19l83.199-31.905L447.146,273.504\n      z M256,100.372l58.991,21.549L256,144.542l-58.992-22.622L256,100.372z M89.031,280.685l58.992-21.549l58.991,21.549l-58.992,22.622\n      L89.031,280.685z M256,401.143L222.196,384.5l9.026-3.461l-0.004-107.784l-73.013-26.689v-63.917l14.597-5.749v45.375L256,254.18\n      l83.199-31.905V176.9l14.597,5.749v63.911l-73.031,26.713L280.76,381.04l9.036,3.466L256,401.143z M304.968,280.685l58.992-21.549\n      l58.991,21.549l-58.992,22.622L304.968,280.685z"})
  )

    );
  };
  _view.styleFunctions["style"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || { width: "100%", height: "100%" };
  };

  _view.styleFunctions["stylesvg"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      transform: "scale(1.8)"
    };
  };return _view;
});
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; "use strict";

                          Flint.defineView("Darkness", "-1153483756", function _flintDefineView() {
    var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
    ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        return Flint.createElement(0.4855872062034905, "Flint.DarknessWrapper", _view, {view: "Darkness"}, Flint.createElement(0.28923258697614074, "div", _view, null)

        );
    };
    _view.styleFunctions["stylediv"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        return false || {
            opacity: _view.props.shown ? 1 : 0,
            transition: "all 50ms ease-in",
            position: "fixed",
            top: _view.props.top,
            left: _view.props.left,
            border: "1px solid yellow",
            zIndex: 1000000,
            boxShadow: "0 0 0 2000px rgba(0,0,0,0.2)",
            borderRadius: _view.props.borderRadius,
            width: _view.props.width,
            height: _view.props.height };
    };return _view;
});
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; 'use strict';

var split = _view.split = function (s, i) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  return [s.substring(0, i), s.substring(i, i + 1), s.substring(i + 1)];
};

var niceRuntimeError = _view.niceRuntimeError = function (err) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  err.niceMessage = err.message.replace(/Uncaught .*Error:\s*/, '').replace(/\_vars\./g, String.fromCharCode('64'));
};

var niceCompilerMessage = _view.niceCompilerMessage = function (err) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  err.niceMessage = err.message.replace(err.file + ': ', '').replace(/identifier ([a-z]*)\s*Unknown global name/, '$' + '1 is not defined').replace(/\([0-9]+\:[0-9]+\)/, '').replace(/Line [0-9]+\:\s*/, '');
};

var niceStack = _view.niceStack = function (err) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  if (err.stack) {
    console.log(err.stack);
    err.stack.split('\n').forEach(function (line) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
      if (line[0] === '>') {
        err.niceStack = line.replace('const ', '').replace(/Flint.([a-zA-Z]*)Wrapper/g, '$' + '1').replace(/\_vars\./g, String.fromCharCode('64')).replace(/\>\s*[0-9]+\s*\|\s*/, '');

        var colIndex = _view.colIndex = err.col - 1;
        err.niceStack = split(err.niceStack, colIndex);
      }
    });
  }
};

                        Flint.defineView('Errors', '1560085645', function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  _view.set('error', _vars.error = null);
  _view.set('compileError', _vars.compileError = null);
  _view.set('runtimeError', _vars.runtimeError = null);
  _view.set('errorDelayTimeout', _vars.errorDelayTimeout = null);

  /* only set _vars.error if there is an error,
     giving compile priority */

  var setError = _view.setError = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    clearTimeout(_vars.errorDelayTimeout);

    if (!_vars.compileError && !_vars.runtimeError) {
      _view.set('error', _vars.error = null);
    } else {
      _view.set('errorDelayTimeout', _vars.errorDelayTimeout = setTimeout(function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        if (_vars.runtimeError) {
          niceRuntimeError(_vars.runtimeError);
          _view.set('error', _vars.error = _vars.runtimeError);
        }
        if (_vars.compileError) {
          niceCompilerMessage(_vars.compileError);
          niceStack(_vars.compileError);
          _view.set('error', _vars.error = _vars.compileError);
        }
      }, _vars.compileError ? 200 : 800));
    }
  };

  window._DT.on('compile:error', function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    console.log('compile error', window._DT.data);
    _view.set('runtimeError', _vars.runtimeError = null);
    _view.set('compileError', _vars.compileError = window._DT.data);
    setError();
  });

  window._DT.on('runtime:error', function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    // on multiple errors, prefer the first
    if (_vars.runtimeError) return;
    _view.set('compileError', _vars.compileError = null);
    _view.set('runtimeError', _vars.runtimeError = window._DT.data);
    setError();
  });

  window._DT.on('runtime:success', function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    _view.set('runtimeError', _vars.runtimeError = null);
    setError();
  });

  window._DT.on('compile:success', function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    _view.set('compileError', _vars.compileError = null);
    setError();
  });

  ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.24151674029417336, "Flint.ErrorsWrapper", _view, {view: "Errors"}, Flint.createElement(0.3045838924590498, "ErrorMessage", _view, {error: _vars.error})
    );
  };return _view;
});

                                    Flint.defineView('Errors.ErrorMessage', '314419900', function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  var last = _view.last = function (arr) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return arr[arr.length - 1];
  };
  var fileName = _view.fileName = function (url) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return last(url.split('/'));
  };

  var devHeight = _view.devHeight = 0; // 34 with bar
  var closedHeight = _view.closedHeight = 55;
  var openHeight = _view.openHeight = 200;

  _view.set('open', _vars.open = false); /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.6702672298997641, "Flint.Errors.ErrorMessageWrapper", _view, {view: "Errors.ErrorMessage"}, Flint.createElement(0.7014633514918387, "error", _view, null, 
    _view.props.error && Flint.createElement(0.9982103505171835, "inner", _view, {if: _view.props.error}, 
      Flint.createElement(0.2943665077909827, "where", _view, null, fileName(_view.props.error.file), _view.props.error.line && ' (L' + (_view.props.error.line - 1) + ')'), 
      ' ', 
      Flint.createElement(0.06926750531420112, "errorTitle", _view, null, 
        _view.props.error.niceMessage || _view.props.error.message, 
        _view.props.error.niceStack && Flint.createElement(0.6635561275761575, "niceStack", _view, null, 
            _view.props.error.niceStack[0], 
            Flint.createElement(0.9533689529635012, "errCol", _view, null, _view.props.error.niceStack[1]), 
            _view.props.error.niceStack[2]
          )
      )
    )
  )

    );
  };
  _view.styleFunctions['styleerror'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      background: '#fff',
      borderTop: '1px solid rgba(255,0,0,0.2)',
      position: 'fixed',
      left: 0,
      height: _vars.open ? openHeight : 'auto',
      bottom: _view.props.error ? devHeight : devHeight - closedHeight,
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
  };

  _view.styleFunctions['styleinner'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      display: 'block' };
  };

  _view.styleFunctions['stylewhere'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      display: 'inline-block',
      fontSize: 15,
      pointerEvents: 'all',
      fontWeight: 'bold',
      color: '#C51E19'
    };
  };

  _view.styleFunctions['styleerrorTitle'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      display: 'inline'
    };
  };

  _view.styleFunctions['stylemsg'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      display: 'inline-block',
      fontSize: 16,
      fontWeight: 'bold',
      pointerEvents: 'all' };
  };

  _view.styleFunctions['styleniceStack'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      opacity: 0.65,
      display: 'inline',
      fontFamily: 'Meslo, Menlo, Monaco, monospace',
      fontSize: 14,
      padding: '0 10px'
    };
  };

  _view.styleFunctions['styleerrCol'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      display: 'inline',
      background: 'red',
      color: 'white'
    };
  };

  _view.styleFunctions['stylestack'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      fontFamily: 'monospace',
      fontSize: 14,
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      maxHeight: 200
    };
  };

  _view.styleFunctions['styleline'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      whiteSpace: 'pre',
      pointerEvents: 'all'
    };
  };

  _view.styleFunctions['styleboldline'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      whiteSpace: 'pre',
      pointerEvents: 'all',
      fontWeight: 'bold'
    };
  };return _view;
});

                           Flint.defineView('ErrorIcon', '-662314280', function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.8204924473538995, "Flint.ErrorIconWrapper", _view, {view: "ErrorIcon"}, Flint.createElement(0.9031841321848333, "svg", _view, {viewBox: "0 0 27.963 27.963"}, 
    Flint.createElement(0.09142650570720434, "path", _view, {d: "M13.983,0C6.261,0,0.001,6.259,0.001,13.979c0,7.724,6.26,13.984,13.982,13.984s13.98-6.261,13.98-13.984\\n      C27.963,6.259,21.705,0,13.983,0z M13.983,26.531c-6.933,0-12.55-5.62-12.55-12.553c0-6.93,5.617-12.548,12.55-12.548\\n      c6.931,0,12.549,5.618,12.549,12.548C26.531,20.911,20.913,26.531,13.983,26.531z"}), 
    Flint.createElement(0.6855343270581216, "polygon", _view, {points: "15.579,17.158 16.191,4.579 11.804,4.579 12.414,17.158"}), 
    Flint.createElement(0.7447090449277312, "path", _view, {d: "M13.998,18.546c-1.471,0-2.5,1.029-2.5,2.526c0,1.443,0.999,2.528,2.444,2.528h0.056c1.499,0,2.469-1.085,2.469-2.528\\n      C16.441,19.575,15.468,18.546,13.998,18.546z"})
  )

    );
  };
  _view.styleFunctions['stylesvg'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      width: 19,
      fill: 'red',
      margin: -4,
      marginLeft: 3,
      marginRight: 6,
      opacity: 0.9
    };
  };return _view;
});
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; "use strict";

                       Flint.defineView("Group", "-452448910", function _flintDefineView() {
    var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
    ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        return Flint.createElement(0.1892565826419741, "Flint.GroupWrapper", _view, {view: "Group"}, Flint.createElement(0.4598883306607604, "group", _view, {yield: true})

        );
    };
    _view.styleFunctions["stylegroup"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        return false || {
            flexFlow: "row",
            height: "100%",
            opacity: 0.6,
            transition: "all ease-in 100ms" };
    };return _view;
});

/*
    ':hover': {
      opacity: 1
    }
*/
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; "use strict";

                      Flint.defineView("Icon", "-269766990", function _flintDefineView() {
    var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
    ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        return Flint.createElement(0.5248594568111002, "Flint.IconWrapper", _view, {view: "Icon"}, Flint.createElement(0.832285221433267, "icon", _view, {yield: true})

        );
    };
    _view.styleFunctions["style"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        return false || {
            width: 20,
            height: 20,
            padding: 4,
            margin: "auto"
        };
    };return _view;
});
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; "use strict";

var furthest = _view.furthest = function (n, ls) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  var index = _view.index = ls.map(function (i) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return i < n;
  }).indexOf(false);
  return ls[(index == -1 ? ls.length : index) - 1];
};

                           Flint.defineView("Inspector", "1193205527", function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  var liveProfiling = _view.liveProfiling = false;
  _view.set('curViewName', _vars.curViewName = null);
  _view.set('curViewLine', _vars.curViewLine = null);
  _view.set('editorState', _vars.editorState = null);

  /*
     _vars.appView = {
      '/path/to/filename.js': {
        views: {
          0: 'Main',
          10: 'Guess',   // index to name of view
          20: 'Other'
        }
        locations: [0, 10, 20] // index of view
      }
    }
     _vars.editorState = {
      file: '/path/to/filename.js',
      line: 96
    }
   */
  _view.set('appViews', _vars.appViews = null);

  window._DT.on("editor:location", function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    if (!liveProfiling) return;
    _view.set('editorState', _vars.editorState = window._DT.editorLocation);

    if (_vars.appViews) {
      var viewState = _view.viewState = _vars.appViews[_vars.editorState.file];
      _view.set('curViewLine', _vars.curViewLine = furthest(_vars.editorState.line, viewState.locations));
      _view.set('curViewName', _vars.curViewName = viewState.views[_vars.curViewLine]);
      dark(_vars.curViewName.toLowerCase());
    }
  });

  window._DT.on("view:locations", function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    if (!liveProfiling) return;
    _view.set('appViews', _vars.appViews = window._DT.viewLocations);
  });

  ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.31454762048088014, "Flint.InspectorWrapper", _view, {view: "Inspector"}, Flint.createElement(0.9069526793900877, "inspector", _view, null)

    );
  };
  _view.styleFunctions["styleinspector"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      height: "100%"
    };
  };

  _view.styleFunctions["stylebutton"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      height: "100%",
      lineHeight: "45px",
      padding: "0 20px",
      color: "#fff",
      flexFlow: "row",
      border: "none"
    };
  };return _view;
});
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; "use strict";

                           Flint.defineView("Installer", "-1143451439", function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  _view.set('name', _vars.name = "");
  _view.set('state', _vars.state = 0);

  window._DT.on("package:install", function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    console.log("intalling package", window._DT.data);
    _view.set('state', _vars.state = 1);
    _view.set('name', _vars.name = window._DT.data.name);
  });

  window._DT.on("package:installed", function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    _view.set('state', _vars.state = 2);
    setTimeout(function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
      _view.set('state', _vars.state = 0);
    }, 2000);
  });

  ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.17964528896845877, "Flint.InstallerWrapper", _view, {view: "Installer"}, _vars.state < 2 && Flint.createElement(0.8218093772884458, "img", _view, {if: _vars.state < 2, src: "/assets/flint-tools/loading.svg"}), 
  _vars.state == 1 && Flint.createElement(0.9451294105965644, "two", _view, {if: _vars.state == 1}, "Installing ", _vars.name), 
  _vars.state == 2 && Flint.createElement(0.5785671859048307, "three", _view, {if: _vars.state == 2}, "Installed!")

    );
  };
  _view.styleFunctions["style"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      position: "absolute",
      top: _vars.state > 0 ? 20 : -100,
      right: 20,
      padding: [6, 10],
      background: "#f2f2f2",
      border: "1px solid #ccc",
      boxShadow: "0 0 15px rgba(0,0,0,0.1)",
      color: "#C43D2D",
      fontFamily: "'Source Code Pro', Menlo, Monaco, monospace",
      fontWeight: "bold",
      transition: "all ease-in 200ms",
      textAlign: "center"
    };
  };

  _view.styleFunctions["styleimg"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      position: "absolute",
      bottom: 0,
      right: "50%",
      marginRight: -50,
      width: 100,
      height: 17,
      marginBottom: -15
    };
  };return _view;
});

// breaks flint build right now:

// declare var InstallerLoadingBar: any; Flint.defineView("Installer.LoadingBar", "1402391687", (function _flintDefineView() { const _view = this; var _vars = Flint.values[_view.entityId]; var inView = true;
//   <svg viewBox="0 14 32 18" width="32" height="4" fill="#f20" preserveAspectRatio="none">
//     <path opacity="0.8" transform="translate(0 0)" d="M2 14 V18 H6 V14z">
//       <animateTransform
//         attributeName="transform"
//         type="translate"
//         values="0 0; 24 0; 0 0"
//         dur="2s"
//         begin="0"
//         repeatCount="indefinite"
//         keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
//         calcMode="spline"
//       />
//     </path>
//     <path opacity="0.5" transform="translate(0 0)" d="M0 14 V18 H8 V14z">
//       <animateTransform
//         attributeName="transform"
//         type="translate"
//         values="0 0; 24 0; 0 0"
//         dur="2s"
//         begin="0.1s"
//         repeatCount="indefinite"
//         keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
//         calcMode="spline"
//       />
//     </path>
//     <path opacity="0.25" transform="translate(0 0)" d="M0 14 V18 H8 V14z">
//       <animateTransform
//         attributeName="transform"
//         type="translate"
//         values="0 0; 24 0; 0 0"
//         dur="2s"
//         begin="0.2s"
//         repeatCount="indefinite"
//         keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
//         calcMode="spline"
//       />
//     </path>
//   </svg>
// }
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; "use strict";

                      Flint.defineView("Logo", "129097406", function _flintDefineView() {
    var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
    ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        return Flint.createElement(0.1487149139866233, "Flint.LogoWrapper", _view, {view: "Logo"}, Flint.createElement(0.5785868167877197, "logo", _view, {onClick: _view.props.onClick}, 
    "F"
  )

        );
    };
    _view.styleFunctions["style"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        return false || {
            color: "#777",
            background: "rgba(255,255,255,0.5)",
            width: 30,
            textAlign: "center",
            fontSize: 18,
            fontWeight: 700,
            lineHeight: "36px",
            cursor: "pointer",
            transition: "all ease-in 100ms" };
    };return _view;
});
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; 'use strict';

function _defineProperty(obj, key, value) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {});  return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); }

Flint.defineStore('State',  function _flintStore() {
  var _view = this;var inView = true;var _vars = Flint.values[_view.entityId];
  _view.set('hovered', _vars.hovered = false);
  _view.set('dragging', _vars.dragging = false);
});

Flint.defineStore('Keys',  function _flintStore() {
  var _view = this;var inView = true;var _vars = Flint.values[_view.entityId];
  _view.set('ctrl', _vars.ctrl = false);
});

var f = _view.f = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  return window.Flint;
};
var listeners = _view.listeners = [];

var qsa = _view.qsa = function (sel) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  return document.querySelectorAll(sel);
};

var listen = _view.listen = function (name, listener) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  return listeners.push(_defineProperty({}, name, listener));
};
var emit = _view.emit = function (name, data) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  return listeners.forEach(function (listener) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return listener[name] && listener[name](data);
  });
};

var localGet = _view.localGet = function (name) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  return localStorage.getItem(name) == 'undefined' ? undefined : JSON.parse(localStorage.getItem(name));
};
var localSet = _view.localSet = function (name, val) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  return localStorage.setItem(name, JSON.stringify(val));
};

setTimeout(function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  var flint = _view.flint = f();
  if (flint && flint.snapshots) {
    emit('newSnapshot', flint.snapshots);
    emit('viewChange');
    flint.on('newSnapshot', function (data) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
      return emit('snapshot', flint.snapshots);
    });
    flint.on('viewChange', function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
      return emit('viewChange');
    });
  }
}, 500);

// hotkey for toggle
addEventListener('keydown', function (e) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  if (e.ctrlKey) devTools.Keys._vars.ctrl = true;
});
addEventListener('keyup', function (e) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  if (e.ctrlKey) devTools.Keys._vars.ctrl = false;
});
addEventListener('keydown', function (e) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  if (devTools.Keys._vars.ctrl) {
    // F
    if (e.keyCode === 70) emit('toggleBar');
    // S
    if (e.keyCode === 83) emit('toggleState');
  }
});

                      Flint.defineView('Main', '1215966961', function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  _view.set('currentEntityId', _vars.currentEntityId = null);
  addEventListener('mousedown', function (e) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    if (e.ctrlKey || e.button == 2) _view.set('currentEntityId', _vars.currentEntityId = e.target.getAttribute('data-flint-id'));
  });

  window.showInspector = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    devInspector.link(_vars.currentEntityId);
  };

  _view.set('stateHide', _vars.stateHide = localGet('stateHide'));
  _view.set('barHide', _vars.barHide = localGet('barHide'));
  _view.set('distance', _vars.distance = 0);
  _view.set('snapshots', _vars.snapshots = []);
  _view.set('cur', _vars.cur = 0);
  _view.set('target', _vars.target = null);

  _view.set('showDarkness', _vars.showDarkness = false);
  _view.set('darknessBounds', _vars.darknessBounds = {});

  var getDarkness = _view.getDarkness = function (view) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    _view.set('target', _vars.target = qsa('.view-' + view.toLowerCase())[0]);
    _view.set('darkStyle', _vars.darkStyle = _vars.target.getBoundingClientRect());
    _view.set('darkStyle', _vars.darkStyle.borderRadius = _vars.target.style.borderRadius || '0px');
    _view.set('showDarkness', _vars.showDarkness = true);
  };

  listen('snapshot', function (data) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return; // timeline is turned off for now
    _view.set('snapshots', _vars.snapshots = data);
    _view.set('cur', _vars.cur = _vars.snapshots.length);
  });

  listen('toggleBar', function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    _view.set('barHide', _vars.barHide = !_vars.barHide);
    localSet('barHide', _vars.barHide);
  });

  listen('toggleState', function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    _view.set('stateHide', _vars.stateHide = !_vars.stateHide);
    localSet('stateHide', _vars.stateHide);
  });

  _view.set('traveling', _vars.traveling = false);

  window.dark = getDarkness;

  //    <Darkness shown = {_vars.showDarkness} {..._vars.darkStyle} />
  var toSnapshot = _view.toSnapshot = function (index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    f().timeTraveling = true;
    f().toSnapshot(index);
    _view.set('cur', _vars.cur = index);
  };

  var scrub = _view.scrub = function (to) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    var index = _view.index = Math.floor(to * _vars.snapshots.length);
    toSnapshot(index);
  };

  var playNext = _view.playNext = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return toSnapshot(_vars.cur + 1);
  }; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.48431385052390397, "Flint.MainWrapper", _view, {view: "Main"}, Flint.createElement(0.7515743356198072, "Errors", _view, null), 
  Flint.createElement(0.6038895277306437, "Installer", _view, null), 
  false && Flint.createElement(0.9423489146865904, "State", _view, {if: false, hide: _vars.stateHide}), 
  false && Flint.createElement(0.49303663638420403, "Bar", _view, {if: false, hide: _vars.barHide}, 
    Flint.createElement(0.34024653397500515, "row", _view, null, 
      Flint.createElement(0.35173851647414267, "Logo", _view, {onClick: function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
            return showNPM();
          }}), 
      Flint.createElement(0.2634888458997011, "Console", _view, null), 
      Flint.createElement(0.8283588797785342, "Player", _view, {scrub: scrub, playNext: playNext, snapshots: _vars.snapshots, cur: _vars.cur}), 
      Flint.createElement(0.5839389048051089, "Controls", _view, null), 
      Flint.createElement(0.5409847889095545, "Inspector", _view, null), 
      Flint.createElement(0.30486022238619626, "Scrubber", _view, {scrub: scrub, snapshots: _vars.snapshots, cur: _vars.cur})
    )
  )

    );
  };
  _view.styleFunctions['stylerow'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      height: 34,
      opacity: 0.95,
      color: '#333',
      flexFlow: 'row',
      pointerEvents: 'all',
      transition: 'all ease-in 100ms' };
  };return _view;
});
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; "use strict";

                        Flint.defineView("Player", "-8726617", function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  _view.set('playing', _vars.playing = false);
  _view.set('playInterval', _vars.playInterval = false);

  var pause = _view.pause = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    _view.set('playing', _vars.playing = false);
    clearInterval(_vars.playInterval);
  };

  var play = _view.play = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    _view.set('playing', _vars.playing = true);
    _view.set('playInterval', _vars.playInterval = setInterval(function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
      if (_view.props.cur < _view.props.snapshots.length) _view.props.playNext();else pause();
    }, 200));
  }; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.7725893543101847, "Flint.PlayerWrapper", _view, {view: "Player"}, Flint.createElement(0.49430049560032785, "Group", _view, null, 
    Flint.createElement(0.43529947637580335, "Button", _view, {icon: Flint.createElement(0.14587078127078712, "Rwd", _view, null)}), 
    Flint.createElement(0.39857972552999854, "Button", _view, {icon: Flint.createElement(0.19852467253804207, "Play", _view, null), show: !_vars.playing, onClick: play}), 
    Flint.createElement(0.6094518990721554, "Button", _view, {icon: Flint.createElement(0.5588438552804291, "Pause", _view, null), show: _vars.playing, onClick: pause}), 
    Flint.createElement(0.814700192771852, "Button", _view, {click: function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
          return false;
        }, icon: Flint.createElement(0.11894398531876504, "Fwd", _view, null)})
  )

    );
  };
  _view.styleFunctions["styleGroup"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      marginTop: 5
    };
  };return _view;
});

                            Flint.defineView("Player.Play", "-538184070", function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.6590944367926568, "Flint.Player.PlayWrapper", _view, {view: "Player.Play"}, Flint.createElement(0.5506533395964652, "svg", _view, {viewBox: "0 0 232 232"}, 
    Flint.createElement(0.10014126845635474, "path", _view, {d: "M203.791,99.628L49.307,2.294c-4.567-2.719-10.238-2.266-14.521-2.266 c-17.132,0-17.056,13.227-17.056,16.578v198.94c0,2.833-0.075,16.579,17.056,16.579c4.283,0,9.955,0.451,14.521-2.267 l154.483-97.333c12.68-7.545,10.489-16.449,10.489-16.449S216.471,107.172,203.791,99.628z"})
  )

    );
  };
  _view.styleFunctions["style"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || { width: "100%", height: "100%" };
  };return _view;
});

                           Flint.defineView("Player.Fwd", "625497357", function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.7956545790657401, "Flint.Player.FwdWrapper", _view, {view: "Player.Fwd"}, Flint.createElement(0.01887780660763383, "svg", _view, {viewBox: "0 0 250 250"}, 
    Flint.createElement(0.12695478042587638, "path", _view, {d: "M242.381,110.693L140.415,24.591c-3.48-2.406-7.805-2.005-11.071-2.005 c-13.061,0-13.003,11.7-13.003,14.666v65.249l-92.265-77.91c-3.482-2.406-7.807-2.005-11.072-2.005 C-0.057,22.587,0,34.287,0,37.252v175.983c0,2.507-0.057,14.666,13.004,14.666c3.265,0,7.59,0.401,11.072-2.005l92.265-77.91 v65.249c0,2.507-0.058,14.666,13.003,14.666c3.266,0,7.591,0.401,11.071-2.005l101.966-86.101 c9.668-6.675,7.997-14.551,7.997-14.551S252.049,117.367,242.381,110.693z"})
  )

    );
  };
  _view.styleFunctions["style"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || { width: "100%", height: "100%" };
  };return _view;
});

                             Flint.defineView("Player.Pause", "-1462576456", function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.8197306166402996, "Flint.Player.PauseWrapper", _view, {view: "Player.Pause"}, Flint.createElement(0.7315801065415144, "svg", _view, {viewBox: "0 0 438.536 438.536"}, 
    Flint.createElement(0.15934057417325675, "path", _view, {d: "M164.453,0H18.276C13.324,0,9.041,1.807,5.425,5.424C1.808,9.04,0.001,13.322,0.001,18.271v401.991 c0,4.948,1.807,9.233,5.424,12.847c3.619,3.617,7.902,5.428,12.851,5.428h146.181c4.949,0,9.231-1.811,12.847-5.428 c3.617-3.613,5.424-7.898,5.424-12.847V18.271c0-4.952-1.807-9.231-5.428-12.847C173.685,1.807,169.402,0,164.453,0z"}), 
    Flint.createElement(0.6826593647710979, "path", _view, {d: "M433.113,5.424C429.496,1.807,425.215,0,420.267,0H274.086c-4.949,0-9.237,1.807-12.847,5.424 c-3.621,3.615-5.432,7.898-5.432,12.847v401.991c0,4.948,1.811,9.233,5.432,12.847c3.609,3.617,7.897,5.428,12.847,5.428h146.181 c4.948,0,9.229-1.811,12.847-5.428c3.614-3.613,5.421-7.898,5.421-12.847V18.271C438.534,13.319,436.73,9.04,433.113,5.424z"})
  )

    );
  };
  _view.styleFunctions["style"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || { width: "100%", height: "100%" };
  };return _view;
});

                           Flint.defineView("Player.Rwd", "-1928076961", function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.06593956612050533, "Flint.Player.RwdWrapper", _view, {view: "Player.Rwd"}, Flint.createElement(0.9882133270148188, "svg", _view, {viewBox: "0 0 250 250"}, 
    Flint.createElement(0.48753966903313994, "path", _view, {d: "M237.484,22.587c-3.266,0-7.591-0.401-11.072,2.005l-92.264,77.91V37.252 c0-2.507,0.057-14.666-13.004-14.666c-3.265,0-7.59-0.401-11.072,2.005L8.107,110.693c-9.669,6.674-7.997,14.551-7.997,14.551 s-1.671,7.878,7.997,14.551l101.965,86.102c3.482,2.405,7.807,2.004,11.072,2.004c13.062,0,13.004-11.7,13.004-14.666v-65.249 l92.264,77.911c3.482,2.405,7.807,2.004,11.072,2.004c13.062,0,13.004-11.7,13.004-14.666V37.252 C250.488,34.746,250.546,22.587,237.484,22.587z"})
  )

    );
  };
  _view.styleFunctions["style"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || { width: "100%", height: "100%" };
  };return _view;
});
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; 'use strict';

var popoverBG = _view.popoverBG = '#fafafa';
var isObject = _view.isObject = function (obj) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  return typeof obj === 'object' && !Array.isArray(obj) && obj !== null;
};
var getValue = _view.getValue = function (label) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  return f().values[devInspector.id][label];
};
var update = _view.update = function (label, value) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  var currentVal = _view.currentVal = getValue(label);
  if (!isNaN(value)) {
    value = +value;
  } // if is number
  f().set(devInspector.id, label, value);
};

                          Flint.defineView('FPopover', '1688821158', function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  _view.set('isOpen', _vars.isOpen = false);
  _view.set('selector', _vars.selector = null);
  _view.set('states', _vars.states = []);
  _view.set('props', _vars.props = []);
  _view.set('view', _vars.view = {});

  window.addEventListener('keydown', function (e) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    if (_vars.isOpen && e.keyCode === 27) _view.set('isOpen', _vars.isOpen = !_vars.isOpen);
  });

  window.devInspector = {
    link: function link(id) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
      devInspector.id = id;

      var render = _view.render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        return devInspector.refresh(f().values[id], f().activeViews[id]);
      };
      f().on('render:' + devInspector.id, render);
      f().on('traveling', render);
      render();
      _view.set('selector', _vars.selector = '[data-flint-id="' + id + '"]');
      _view.set('isOpen', _vars.isOpen = true);
    },
    id: null,
    refresh: function refresh(state, view) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
      _view.set('view', _vars.view = view);
      _view.set('states', _vars.states = Object.keys(state).map(function (label) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        return { label: label, value: state[label] };
      }));
      _view.set('props', _vars.props = Object.keys(view.props).filter(function (name) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        return !name.match(/(children|data-flint-id|className|style)$/);
      }).map(function (label) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        return { label: label, value: view.props[label] };
      }));
    }
  }; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.976450472837314, "Flint.FPopoverWrapper", _view, {view: "FPopover"}, Flint.createElement(0.6319087634328753, "Popover", _view, {body: Flint.createElement(0.925629721255973, "box", _view, null, 
        Flint.createElement(0.1887288922443986, "bg", _view, null), 
        Flint.createElement(0.7515051388181746, "content", _view, null, 
          Flint.createElement(0.12735304841771722, "viewName", _view, null, 
            Flint.createElement(0.2734218060504645, "wrap", _view, null, _vars.view.name)
          ), 
          Flint.createElement(0.001309374114498496, "Pane", _view, {title: "Props", variables: _vars.props}), 
          Flint.createElement(0.7762703767511994, "Pane", _view, {title: "State", variables: _vars.states})
        )
      ), isOpen: _vars.isOpen, tipSize: 8, target: document.querySelectorAll(_vars.selector)[0]}
  )

    );
  };
  _view.styleFunctions['stylePopover'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      zIndex: 100000
    };
  };

  _view.styleFunctions['stylebox'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      position: 'relative'
    };
  };

  _view.styleFunctions['stylebg'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      // backgroundImage: `url(${toolsBg})`,
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 0,
      opacity: 0.5
    };
  };

  _view.styleFunctions['stylecontent'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      position: 'relative',
      zIndex: 100
    };
  };

  _view.styleFunctions['styleviewName'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      fontWeight: 'bold',
      fontSize: 13,
      color: '#333',
      textAlign: 'center'
    };
  };

  _view.styleFunctions['stylewrap'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      display: 'inline-block',
      padding: '8px 0 2px',
      margin: '0'
    };
  };return _view;
});

var styles = _view.styles = document.createElement('style');
styles.innerHTML = '\n  /* Styles that give the Popover a look-and-feel. */\n\n  .Popover-body {\n    display: inline-flex;\n    flex-direction: column;\n    background-color: ' + popoverBG + ';\n    border-radius: 4px;\n    border: 1px solid #DADADA;\n    box-shadow: 0 0 22px rgba(0,0,0,0.1), 0 0 1px #fff inset;\n    max-height: 600px;\n    overflow-y: scroll;\n  }\n\n  .Popover-tipShape {\n    fill: ' + popoverBG + ';\n  }\n';
document.head.appendChild(styles);
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; "use strict";

                      Flint.defineView("Repl", "-23650733", function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  _view.styleFunctions["stylex"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || 5;
  };return _view;
});
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; "use strict";

var addEvent = _view.addEvent = function (e, cb) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  return window.addEventListener(e, cb);
};
var removeEvent = _view.removeEvent = function (e, cb) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  return window.removeEventListener(e, cb);
};

                          Flint.defineView("Scrubber", "-2017345671", function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  var size = _view.size = 16;
  var maxLeft = _view.maxLeft = "98%";

  _view.set('dragging', _vars.dragging = false);
  _view.set('left', _vars.left = maxLeft);

  var inRange = _view.inRange = function (percent) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Math.max(1, Math.min(percent, parseInt(maxLeft)));
  };

  var setLeft = _view.setLeft = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    if (_vars.dragging) return;
    // return (100*(_view.props.cur / _view.props.snapshots.length)) + '%'
    if (_view.props.cur === 0 && _view.props.snapshots.length === 0) {
      return _view.set('left', _vars.left = maxLeft);
    }
    _view.set('left', _vars.left = inRange(100 * (_view.props.cur / _view.props.snapshots.length)) + "%");
  };

  this.beforeRender = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    setLeft();
  };

  var withinWindow = _view.withinWindow = function (x) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Math.max(Math.min(x, window.innerWidth - 10) - size, 0);
  };

  this.componentWillRecieveProps = setLeft;

  _view.set('moveListener', _vars.moveListener = null);
  _view.set('upListener', _vars.upListener = null);

  var drag = _view.drag = function (e) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    _view.set('dragging', _vars.dragging = true);
    _view.set('left', _vars.left = withinWindow(e.pageX));
    _view.props.scrub(_vars.left / window.innerWidth);
  };

  var dragEnd = _view.dragEnd = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    _view.set('dragging', _vars.dragging = false);
    var perc = _view.perc = _vars.left / window.innerWidth;
    if (perc > 0.88) {
      _view.props.scrub(_view.props.snapshots.length);
      _view.set('left', _vars.left = maxLeft);
    } else {
      setLeft();
    }
  };

  var dragStart = _view.dragStart = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    addEvent("mousemove", drag);

    var unbindDragEnd = _view.unbindDragEnd = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
      removeEvent("mousemove", drag);
      removeEvent("mouseup", unbindDragEnd);
      dragEnd();
    };

    addEvent("mouseup", unbindDragEnd);
  }; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.6062063323333859, "Flint.ScrubberWrapper", _view, {view: "Scrubber"}, Flint.createElement(0.3304463238455355, "bar", _view, null, 
    Flint.createElement(0.3783797475043684, "pos", _view, {className: { dragging: _vars.dragging}, mouseDown: dragStart})
  )

    );
  };
  _view.styleFunctions["stylebar"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      background: "rgba(0,0,0,0.2)",
      height: _vars.dragging ? 3 : 0, //State._vars.hovered ||
      position: "absolute",
      borderTop: "1px solid rgba(0, 0, 0, 0.0005)",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      transition: "all ease-in 100ms"
    };
  };

  _view.styleFunctions["stylepos"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      position: "absolute",
      top: -(size * 0.49),
      borderRadius: 100,
      left: _vars.left,
      width: size,
      height: size,
      background: "linear-gradient(#3CAAFF, #2D7DBA)",
      boxShadow: "0 0 2px rgba(0,0,0,0.2)",
      cursor: "pointer",
      transition: "transform 50ms, left 200ms ease-in" };
  };

  _view.styleFunctions["style.dragging"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      transform: "scale(1.5)",
      transition: "none",
      background: "linear-gradient(#5CC2FF, #4E92BA)"
    };
  };return _view;
});

// ':hover': _view.getStyle(_view.entityId, "style.posActive")
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; 'use strict';

var notBaseProp = _view.notBaseProp = function (name) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  return ['style', 'children'].indexOf(name) == -1;
};

var getState = _view.getState = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  var f = _view.f = window.Flint;
  var viewState = _view.viewState = Object.keys(f.activeViews).map(function (id) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return {
      title: f.activeViews[id].name,
      props: Object.keys(f.activeViews[id].props).filter(notBaseProp).map(function (key) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        return {
          label: key, value: f.activeViews[id].props[key]
        };
      }),
      vars: Object.keys(f.values[id]).map(function (key) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        return {
          label: key, value: f.values[id][key]
        };
      })
    };
  });

  var storeState = _view.storeState = Object.keys(f.stores).map(function (store) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return {
      title: store,
      vars: Object.keys(f.values[store]).map(function (key) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        return {
          label: key, value: f.values[store][key]
        };
      })
    };
  });
  return viewState.concat(storeState);
};

                       Flint.defineView('State', '1650550743', function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  _view.set('state', _vars.state = []);

  var listen = _view.listen = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    _view.set('state', _vars.state = getState());
    window.Flint.on('newSnapshot', function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
      return _view.set('state', _vars.state = getState());
    });
  };

  setTimeout(listen, 100); /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.08721351460553706, "Flint.StateWrapper", _view, {view: "State"}, _vars.state.__flintmap(function(_, _index) { _view.repeatObject_index = _index; _view.repeatObject = _; if (_ instanceof Object && !(_ instanceof Array)) { var evals = Object.keys(_); for (var i = 0; i < evals.length; i++) { eval('var _' + evals[i] + ' = _[evals[i]];'); } }; return Flint.createElement(0.5838311093393713, "view", _view, {repeat: _vars.state}, 
    Flint.createElement(0.10373307904228568, "Header", _view, {title: _title}), 
    _props.__flintmap(function(_, _index) { _view.repeatObject_index = _index; _view.repeatObject = _; if (_ instanceof Object && !(_ instanceof Array)) { var evals = Object.keys(_); for (var i = 0; i < evals.length; i++) { eval('var _' + evals[i] + ' = _[evals[i]];'); } }; return Flint.createElement(0.6073345367331058, "Var", _view, {name: '[prop] ' + _label, value: _value, repeat: _props}) }), 
    _props.length == 0 && Flint.createElement(0.7759087381418794, "empty", _view, {if: _props.length == 0}, "no props"), 

    _vars.__flintmap(function(_, _index) { _view.repeatObject_index = _index; _view.repeatObject = _; if (_ instanceof Object && !(_ instanceof Array)) { var evals = Object.keys(_); for (var i = 0; i < evals.length; i++) { eval('var _' + evals[i] + ' = _[evals[i]];'); } }; return Flint.createElement(0.08341789082624018, "Var", _view, {name: _label, value: _value, repeat: _vars}) }), 
    _vars.length == 0 && Flint.createElement(0.267524185590446, "empty", _view, {if: _vars.length == 0}, "no state")
  ) })


    );
  };
  _view.styleFunctions['styleempty'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      padding: [0, 10],
      marginTop: 10,
      font: '1em/1 Consolas, monospace',
      cursor: 'pointer' };
  };
  _view.styleFunctions['style'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      overflowY: 'scroll',
      position: 'fixed',
      display: 'block',
      right: _view.props.hide ? -280 : 0,
      top: 0, bottom: 0,
      width: 280,
      borderLeft: '1px solid #ccc',
      background: 'white',
      transition: 'all ease-in 100ms',
      zIndex: 2147483647
    };
  };

  _view.styleFunctions['styleVar'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || { marginTop: 5 };
  };
  _view.styleFunctions['styleview'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      maxHeight: 500,
      flexFlow: 'column',
      display: 'flex'
    };
  };return _view;
});

                     Flint.defineView('Var', '-1112519622', function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  var isObject = _view.isObject = function (v) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return !!v && v.constructor === Object;
  };
  var isArray = _view.isArray = function (v) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return !!v && v.constructor === Array;
  };
  var isComplex = _view.isComplex = function (v) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return isObject(v) || isArray(v);
  };
  var toggle = _view.toggle = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    if (isComplex(_view.props.value)) _view.set('open', _vars.open = !_vars.open);
  };

  _view.set('open', _vars.open = false); /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.3630381980910897, "Flint.VarWrapper", _view, {view: "Var"}, Flint.createElement(0.8516846327111125, "top", _view, null, 
    Flint.createElement(0.9333682195283473, "name", _view, {onClick: toggle}, _view.props.name, ":"), 
    Flint.createElement(0.6137037503067404, "value", _view, null, 
      Flint.createElement(0.2767643630504608, State.Tree, _view, {value: _view.props.value, open: _vars.open, onToggle: function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
            return _view.set('open', _vars.open = !_vars.open);
          }})
    )
  ), 
  _vars.open && Flint.createElement(0.47815650678239763, State.TreeDetail, _view, {value: _view.props.value, if: _vars.open})

    );
  };
  _view.styleFunctions['style'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      padding: [0, 10],
      font: '1em/1 Consolas, monospace',
      cursor: 'pointer',
      flexFlow: 'column' };
  };

  _view.styleFunctions['styletop'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      flexFlow: 'row' };
  };

  _view.styleFunctions['stylevariable'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      flexFlow: 'row' };
  };

  _view.styleFunctions['stylename'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      flexFlow: 'row',
      userSelect: 'none',
      font: '1em/1 Consolas, monospace',
      height: 30,
      color: 'rgba(0, 0, 0, .7)'
    };
  };

  _view.styleFunctions['stylevalue'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      marginLeft: 10
    };
  };return _view;
});

                        Flint.defineView('Header', '-1397801099', function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.30141084315255284, "Flint.HeaderWrapper", _view, {view: "Header"}, Flint.createElement(0.7408873592503369, "label", _view, null, _view.props.title)

    );
  };
  _view.styleFunctions['style'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      flexShrink: 0,
      borderTop: '1px solid #ccc',
      borderBottom: '1px solid #ccc' };
  };

  _view.styleFunctions['stylelabel'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      color: 'rgba(0,0,0,.5)',
      background: '#fafafa',
      fontWeight: 800,
      fontSize: 14,
      padding: [7, 10] };
  };return _view;
});
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; "use strict";

                           Flint.defineView("State.Tree", "632569946", function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  var isObject = _view.isObject = function (v) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return !!v && v.constructor === Object;
  };
  var isArray = _view.isArray = function (v) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return !!v && v.constructor === Array;
  };
  var isComplex = _view.isComplex = function (v) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return isObject(v) || isArray(v);
  };

  var orange = _view.orange = { fontWeight: 600, color: "rgba(227, 147, 0, 0.71)" };
  var typeStyle = _view.typeStyle = {
    string: {
      color: "green" },
    object: { color: "#75b5aa" },
    boolean: orange,
    number: orange
  };

  var toS = _view.toS = function (v) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    if (v === null) return "null";
    if (v.toString) return v.toString();
  }; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.0973760939668864, "Flint.State.TreeWrapper", _view, {view: "State.Tree"}, isObject(_view.props.value) && Flint.createElement(0.3815811655949801, "closed", _view, {if: isObject(_view.props.value), click: _view.props.onToggle}, 
    "{}", " ", Object.keys(_view.props.value).length, " items"
  ), 
  isArray(_view.props.value) && Flint.createElement(0.5752394339069724, "closed", _view, {if: isArray(_view.props.value), click: _view.props.onToggle}, 
    "[]", " ", _view.props.value.length, " items"
  ), 
  !isComplex(_view.props.value) && Flint.createElement(0.20798542513512075, "value", _view, {if: !isComplex(_view.props.value), style: typeStyle[typeof _view.props.value]}, 
    toS(_view.props.value)
  )

    );
  };
  _view.styleFunctions["styleclosed"] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      flexFlow: "row",
      color: "#b0b0b0",
      font: "1em/1 Consolas, monospace" };
  };return _view;
});

                                 Flint.defineView("State.TreeDetail", "-738480591", function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.529501139651984, "Flint.State.TreeDetailWrapper", _view, {view: "State.TreeDetail"}, Object.keys(_view.props.value).__flintmap(function(_, _index) { _view.repeatObject_index = _index; _view.repeatObject = _; if (_ instanceof Object && !(_ instanceof Array)) { var evals = Object.keys(_); for (var i = 0; i < evals.length; i++) { eval('var _' + evals[i] + ' = _[evals[i]];'); } }; return Flint.createElement(0.5245022252202034, "Var", _view, {repeat: Object.keys(_view.props.value), name: _, value: _view.props.value[_]}) })
    );
  };return _view;
});
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; "use strict";

                      Flint.defineView("Tree", "1134646032", function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.159925697138533, "Flint.TreeWrapper", _view, {view: "Tree"}, Flint.createElement(0.22022823290899396, "h1", _view, null, "woo2"), 
  Flint.createElement(0.030437650624662638, "h1", _view, null, "value!")
    );
  };return _view;
});
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; 'use strict';

var lastUnique = _view.lastUnique = function (arr, num) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  var taken = _view.taken = {};
  var result = _view.result = [];
  arr.forEach(function (val) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    if (!taken[val]) {
      result.push(val);
      taken[val] = true;
    }
  });
  return result;
};
var type = _view.type = function (prop) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  return (typeof prop).split().slice(3).join('');
};
var inspect = _view.inspect = function (obj, name) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  return {
    name: name,
    type: type(obj[name]),
    val: typeof obj[name] === 'object' ? JSON.stringify(obj[name]) : obj[name]
  };
};
var info = _view.info = function (obj) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  return Object.keys(obj).reduce(function (acc, val) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return acc.concat(inspect(obj, val));
  }, []);
};

                       Flint.defineView('Views', '2000165322', function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  _view.set('views', _vars.views = []);

  listen('viewChange', function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    var flint = _view.flint = f();
    _view.set('views', _vars.views = flint.activeViews && flint.variables && lastUnique(flint.lastChangedViews, 5).map(function (id) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
      return {
        props: info(flint.activeViews[id].props),
        variables: info(flint.values[id])
      };
    }));
  }); /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.03616510727442801, "Flint.ViewsWrapper", _view, {view: "Views"}, _vars.views.__flintmap(function(_, _index) { _view.repeatObject_index = _index; _view.repeatObject = _; if (_ instanceof Object && !(_ instanceof Array)) { var evals = Object.keys(_); for (var i = 0; i < evals.length; i++) { eval('var _' + evals[i] + ' = _[evals[i]];'); } }; return Flint.createElement(0.8210177866276354, "views", _view, {repeat: _vars.views}, function (view) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
          return null;
        }) })

    );
  };
  _view.styleFunctions['styleviews'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      width: '100%',
      background: '#f2f2f2',
      flexFlow: 'row',
      overflow: 'scroll',
      flexDirection: 'row-reverse',
      maxHeight: '50%'
    };
  };return _view;
});

                           Flint.defineView('Views.View', '1420882322', function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.4062923884484917, "Flint.Views.ViewWrapper", _view, {view: "Views.View"}, Flint.createElement(0.19282339955680072, "view", _view, null, 
    Flint.createElement(0.3314961127471179, "name", _view, null, _view.props.name), 
    Flint.createElement(0.22314073820598423, "props", _view, {className: "section"}, 
      Flint.createElement(0.3336293897591531, "subtitle", _view, null, "Props"), 
      Flint.createElement(0.2669226995203644, "row", _view, null, 
        _view.props.props && _view.props.props.map(function (prop) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
              return Flint.createElement(0.5586747934576124, "Prop", _view, React.__spread({},  prop));
            })
      )
    ), 

    Flint.createElement(0.6521323577035218, "variables", _view, {className: "section"}, 
      Flint.createElement(0.5295843277126551, "subtitle", _view, null, "variables"), 
      Flint.createElement(0.04245948884636164, "row", _view, null, 
        _view.props.variables && _view.props.variables.map(function (variable) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
              return Flint.createElement(0.835622473154217, "Prop", _view, React.__spread({},  variable));
            })
      )
    )
  )

    );
  };
  _view.styleFunctions['styleview'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      background: '#fff',
      boxShadow: '0 0 5px rgba(0,0,0,0.15)',
      padding: 8,
      margin: 8
    };
  };

  _view.styleFunctions['stylename'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      color: '#000',
      fontSize: 15,
      textTransform: 'uppercase',
      fontWeight: 'bold',
      margin: '0 0 4px 0'
    };
  };

  _view.styleFunctions['stylesubtitle'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      fontWeight: 'bold',
      textTransform: 'uppercase',
      fontSize: 12,
      color: '#444',
      margin: '0 0 2px 0',
      background: '#fff',
      display: 'inline-block'
    };
  };

  _view.styleFunctions['stylerow'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      flexFlow: 'row'
    };
  };

  _view.styleFunctions['style.section'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      padding: '5px 0',
      margin: '0 0 4px 0'
    };
  };return _view;
});

                      Flint.defineView('Prop', '-749683389', function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  ; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.24246505228802562, "Flint.PropWrapper", _view, {view: "Prop"}, Flint.createElement(0.7440184010192752, "prop", _view, null, 
    Flint.createElement(0.23983458778820932, "name", _view, null, _view.props.name, " ", Flint.createElement(0.481948061613366, "type", _view, null, _view.props.type)), 
    Flint.createElement(0.43942559720017016, "val", _view, null, JSON.stringify(_view.props.val))
  )

    );
  };
  _view.styleFunctions['styleprop'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      padding: 5,
      border: '1px solid #eee',
      marginRight: -1
    };
  };

  _view.styleFunctions['stylename'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      display: 'inline',
      fontWeight: 'bold',
      fontSize: 13
    };
  };

  _view.styleFunctions['styletype'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      fontWeight: 'normal',
      display: 'inline',
      color: '#999'
    };
  };return _view;
});
/* @flow */                                                                                                                                                                                    var _stores = {}; var _view = { set: (function(){}) }; 'use strict';

var type = _view.type = function (val) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  return Array.isArray(val) ? 'array' : typeof val;
};
var isObject = _view.isObject = function (obj) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
  return typeof obj === 'object' && !Array.isArray(obj) && obj !== null;
};

                          Flint.defineView('TreeView', '2019761209', function _flintDefineView() {
  var _view = this;var _vars = Flint.values[_view.entityId];var inView = true;
  _view.set('closed', _vars.closed = false);

  var showTree = _view.showTree = function (name) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return _view.props.value[name] !== null && isObject(_view.props.value[name].value);
  }; /* BEGIN RENDER */_view._render = function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return Flint.createElement(0.7036769236437976, "Flint.TreeViewWrapper", _view, {view: "TreeView"}, Flint.createElement(0.3633106485940516, "Label", _view, {type: type(_view.props.value), nested: isObject(_view.props.value), closed: _vars.closed, onClick: function () {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
        return _view.set('closed', _vars.closed = !_vars.closed);
      }}, 
    _view.props.nodeLabel
  ), 
  !_vars.closed && Object.keys(_view.props.value).__flintmap(function(_, _index) { _view.repeatObject_index = _index; _view.repeatObject = _; if (_ instanceof Object && !(_ instanceof Array)) { var evals = Object.keys(_); for (var i = 0; i < evals.length; i++) { eval('var _' + evals[i] + ' = _[evals[i]];'); } }; return Flint.createElement(0.7133029378019273, "children", _view, {if: !_vars.closed, repeat: Object.keys(_view.props.value)}, 
      showTree(_.name) && Flint.createElement(0.2799245845526457, "TreeView", _view, {if: showTree(_.name), nodeLabel: name, value: _view.props.value[name]}), 
      !showTree(_.name) && Flint.createElement(0.22247249190695584, "Edit", _view, {if: !showTree(_.name), variable: { name: name, value: _view.props.value[name]}})
  ) })

    );
  };
  _view.styleFunctions['style'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      overflowY: 'hidden',
      margin: _vars.closed && '0 0 10px 0'
    };
  };

  _view.styleFunctions['stylechildren'] = function (_index) {  var _vars = (typeof _vars != 'undefined') ? _vars : (inView ? Flint.values[_view.entityId] : {}); 
    return false || {
      background: 'rgba(0,0,0,0.03)',
      padding: '2px 0',
      maxHeight: 400,
      overflow: 'scroll' };
  };return _view;
});

    Flint.render()
  })(Flint);
}

if (typeof module != 'undefined')
  module.exports = flintRun_tools