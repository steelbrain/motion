## 1.4.0

- Releases are now shrinkwrapped. This should mean much more consistently working releases as well as
  guaranteed rollbacks.

- CLI speed improvements. We bundle most things with webpack before releasing now because `require`
  is slow in node.

- Big improvements in the build system in general, checks for finished aspects are better set up.
  Overall internals are heavily refactored.

- Big packaging improvements. Webpack is used only on stuff that you export/import between your files,
  as well as for external stuff you import. We've done a lot of work to make it more stable and work
  more consistently.

- Webpack configuration now attempts to load sass, images, fonts, etc.

- Local server process now runs in separate process for better hot reload performance

- Babel-runtime now included in builds to fix old browser bugs

- Peerdependencies are installed automatically now when you import a package

- New keyboard shortcuts:
  - "d" to output debug of current state
  - "r" to refresh bundles works better
  - "enter" to show the key options again

- Mutex'es used for all file writing operations

- Using imported objects works now:

```js
import { Modal } from 'xyz'

view Main {
  <Modal.Button /> // works
}
```

- Various style fixes: fixes merging parent styles into children

- Building assets bugfixes

- `<tag repeat={} />` takes iterables

- `on.event` custom events can pass objects: `on.event('custom', { some: 'obj' })`

- flint --cached (for faster startup time, broken atm)

- flint --reset (deletes internals for clean restart)

- Flint recognizes if upgraded and clears internals automatically now

- view.inlineStyles() forces a view to render its styles inline

- view.renderToRoot() to render a view to the root of the document (portals, for modal type views)

- Lots of bugfixes!