export default function viewOn(parentScope) {

  const _on = new On(parentScope)



  return _on
}



//   function _on(scope, name, cb, ...args) {
//     // check if they defined their own scope
//     if (name && typeof name == 'string')
//       return on(scope, name, cb, ...args)
//     else
//       return on(parentScope, scope, name, cb, ...args)
//   }
//
//   // view defaults
//   const viewEvent = boundEvent.bind(null, _on, parentScope)
//
//   _on.__proto__ = on
//
//   _on.mount =  viewEvent('mount')
//   _on.unmount = viewEvent('unmount')
//   _on.change = viewEvent('change')
//   _on.render = viewEvent('render')
//   _on.props = viewEvent('props')
//
//   return _on
// }
//
// function boundEvent(viewOn, scope, name, ...pargs) {
//   return (...args) => viewOn(scope, name, ...pargs, ...args)
// }