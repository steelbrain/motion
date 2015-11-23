// var orig = console.log
// console.log = function(input) {
//     var isChrome = navigator.userAgent.indexOf("Chrome") !== -1;
//     if(isChrome){
//         var stack = new Error().stack;
//         var file = stack.split("\n")[2].split("/")[4].split("?")[0]
//         var line = stack.split("\n")[2].split(":")[5];
//         var append = file + ":" + line;
//     }
//     orig.apply(console, [input, append])
// }

const original = console.log.bind(console)

console.flint = (...args) => {
  if (process.env.production) return

  let search = window.location.search
  let type = search && search.match(/[?&]log=([a-z]+)/)

  if (!search || search.indexOf('log=') == -1) return

  let logger = () => original(...args)

  if (type && type[1] == args[0])
    logger()
  if (!type)
    logger()
}