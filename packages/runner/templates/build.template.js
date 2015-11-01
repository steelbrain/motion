window.flintRun_NAME = function flintRun_NAME(node, opts, cb) {
  var FlintInstace = opts.Flint || runFlint;
  var Flint = FlintInstace(node, opts, cb);

  (function(Flint) {
    CONTENTS

    Flint.init()
  })(Flint);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = flintRun_NAME
}