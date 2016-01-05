# Bundler

Bundler handles all webpack related things in Flint. Flint avoids webpack for view files. But for anything that
you use an "export" in (non-view files), or for anything you "import" from npm, webpack is used for those.

Some basic guides to this directory:

- *internals* - Stuff that you manually export, and then import into other places (internal bundle)
- *externals* - Stuff that you import from npm (external bundle)

This directory does need some love.

- *install* - Logic that runs the install queue for externals