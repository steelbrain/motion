import React from 'react'

// convert object to string for debugging
export default function(el, args, view) {
  return args.map(arg => {
    const type = typeof arg

    if (arg && type != 'string' && !Array.isArray(arg) && !React.isValidElement(arg)) {
      const isObj = String(arg) === '[object Object]'

      if (isObj) {
        // stringify for error
        let str = ''
        try { str = JSON.stringify(arg) } catch(e) {}

        reportError({
          message: `You passed an object to ${view.name} <${el.name}>. In production this will error! Object: ${str}`,
          fileName: _Flint.views[view.name] && _Flint.views[view.name].file
        })

        return str || '{}'
      }
    }

    return arg
  })
}