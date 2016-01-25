import { p, readFile, writeFile } from '../lib/fns'
import opts from '../opts'
import log from '../lib/log'
import handleError from '../lib/handleError'

let OPTS

export default async function makeTemplate() {
  try {
    log('makeTemplate()')
    OPTS = opts()

    const outFile = p(OPTS.buildDir, 'index.html')
    const indexFile = await readFile(p(OPTS.flintDir, 'index.html'))

    let template = indexFile
      .replace(/\/static/g, '/_/static')
      .replace('<!-- STYLES -->', '<link rel="stylesheet" href="/_/styles.css" />')
      // .replace('<!-- EXTERNAL STYLES -->', externalStyles)
      .replace('<!-- SCRIPTS -->', [
        '<script src="/_/react.prod.js"></script>',
        '  <script src="/_/flint.prod.js"></script>',
`
  <script>
    var Flint = exports['flint']
    Flint.init()
  </script>
`,
        '  <script src="/_/externals.js"></script>',
        '  <script src="/_/internals.js"></script>',
        '  <script src="/_/'+OPTS.saneName+'.js"></script>',

`
  <script>
    Flint.run("${OPTS.saneName}")
  </script>
`
      ].join("\n"))

    log('makeTemplate', outFile, template)

    await writeFile(outFile, template)
  }
  catch(e) {
    handleError(e)
  }
}

function makeIsomorphic() {
  // TODO: flint build --isomorphic
  // if (OPTS.isomorphic) {
  //   var Flint = require('flint-js/dist/flint.node')
  //   var app = require(p(OPTS.buildDir, '_', OPTS.saneName))
  //
  //   var FlintApp = app(false, { Flint }, async function(output) {
  //     template = template.replace(
  //       '<div id="_flintapp"></div>',
  //       '<div id="_flintapp">' + output + '</div>'
  //     )
  //
  //     await writeFile(out, template)
  //   })
  //   return
  // }
}