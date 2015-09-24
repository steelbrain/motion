// special map for jsx repeat={Num | Array}
Array.prototype.__flintmap = Array.prototype.map
String.prototype.__flintmap = function(cb) {
  if (!isNaN(this)) {
    numberMap.call(parseInt(this, 10), cb)
  }
  else {
    throw new Error(
      `Error! You called repeat with a string, you need an array
        or number, or string that casts into a number!`
    );
  }
}
Number.prototype.__flintmap = numberMap;

function numberMap(cb) {
  for (let i = 0; i < this; i++) {
    cb(i, i)
  }
}
