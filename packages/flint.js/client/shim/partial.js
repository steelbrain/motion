Object.defineProperty(
  Function.prototype,
  'partial',
  {
    writable: true,
    configurable: true,
    value: function partial() {
      for (var f = this, a = [], i = 0; i < arguments.length; a[i] =
arguments[i++]);
      return function () {
        var args = a.slice(0);
        args.push.apply(a, arguments);
        return f.apply(this, a);
      };
    }
  }
)