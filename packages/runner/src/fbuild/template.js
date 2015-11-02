import { p, readFile, writeFile } from '../lib/fns'
import opts from '../opts'
import log from '../lib/log'
import handleError from '../lib/handleError'

let OPTS

export default async function makeTemplate() {
  try {
    log('makeTemplate()')
    OPTS = opts.get()

    const out = p(OPTS.buildDir, 'index.html')
    const data = await readFile(p(OPTS.flintDir, 'index.html'), 'utf8')
    let template = data
      .replace(/\/static/g, '/_/static')
      .replace('<!-- SCRIPTS -->', [
        '<script src="/_/react.prod.js"></script>',
        '  <script src="/_/flint.prod.js"></script>',
        '  <script src="/_/'+OPTS.name+'.prod.js"></script>',
        `  <script>window.Flint = flintRun_${OPTS.name}("_flintapp", { app: "${OPTS.name}" });</script>`
      ].join("\n"))

    log('makeTemplate', out, template)
    await writeFile(out, template)
  }
  catch(e) {
    handleError(e)
  }
}

function makeIsomorphic() {
  // TODO: flint build --isomorphic
  if (OPTS.isomorphic) {
    var Flint = require('flint-js/dist/flint.node');
    var app = require(p(OPTS.buildDir, '_', OPTS.name));

    var FlintApp = app(false, { Flint }, async function(output) {
      template = template.replace(
        '<div id="_flintapp"></div>',
        '<div id="_flintapp">' + output + '</div>'
      )

      await writeFile(out, template)
    })
    return
  }
}