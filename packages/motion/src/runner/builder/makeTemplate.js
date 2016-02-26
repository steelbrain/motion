import { p, readFile, writeFile } from '../lib/fns'
import opts from '../opts'
import log from '../lib/log'
import handleError from '../lib/handleError'

let OPTS

export default async function makeTemplate() {
  try {
    OPTS = opts()

    const outFile = p(OPTS.buildDir, 'index.html')
    const indexFile = await readFile(p(OPTS.motionDir, 'index.html'))

    let template = indexFile
      .replace(/\/static/g, '/_/static')
      .replace('<!-- STYLES -->', '<link rel="stylesheet" href="/_/styles.css" />')
      // .replace('<!-- EXTERNAL STYLES -->', externalStyles)
      .replace('<!-- SCRIPTS -->', [
        '<script src="/_/react.prod.js"></script>',
        '  <script src="/_/motion.prod.js"></script>',
`
  <script>
    var Motion = exports['motion']
    Motion.init()
  </script>
`,
        '  <script src="/_/externals.js"></script>',
        `  <script src="/_/${opts('saneName')}.js"></script>`,

`
  <script>
    Motion.run("${OPTS.saneName}")
  </script>
`
      ].join("\n"))

    log('makeTemplate writing...')
    await writeFile(outFile, template)
  }
  catch(e) {
    handleError(e)
  }
}

function makeIsomorphic() {
  // TODO: motion build --isomorphic
  // if (OPTS.isomorphic) {
  //   var Motion = require('client/dist/motion.node')
  //   var app = require(p(OPTS.buildDir, '_', OPTS.saneName))
  //
  //   var MotionApp = app(false, { Motion }, async function(output) {
  //     template = template.replace(
  //       '<div id="_motionapp"></div>',
  //       '<div id="_motionapp">' + output + '</div>'
  //     )
  //
  //     await writeFile(out, template)
  //   })
  //   return
  // }
}