function flintRun_<%= data.name %>(node, opts, cb) {
  var FlintInstace = opts.Flint || runFlint;
  var Flint = FlintInstace(node, opts, cb);

  (function(Flint) {
    <%= data.contents %>

    Flint.init()
  })(Flint);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = flintRun_<%= data.name %>
}
