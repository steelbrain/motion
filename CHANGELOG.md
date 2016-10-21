# Changelog

## 4.3.0

- Make `pathType` in motion a configuration

## 4.2.3

- motion-style => gloss

## 4.2.2

- Fix a bug where error would be suppressed if `.motion.json` contains syntax errors
- Upgrade `pundle` version to include a bugfix where pundle would be stuck in loop if there are errors on boot

## 4.2.0

- Motion style now uses it's own createElement rather than adding keys
- Motion style is much faster, simpler, more correct

## 4.0.1

- Fix a bug where `reload` won't work in Motion CLI
- Fix a bug where Motion server errors won't be logged in console

## 4.0.0

- Move config file to `.motion.json` to project root
- Allow full babel control from the configuration file
- Remove `.motion` folder in favor of new `public` folder
- Only includes regenerator runtime when `includesPolyfill` config is enabled

## 3.3.0

- Upgrade to Pundle@1.0 :tada:
 - Added ability to use FileSystem polling by setting the `PUNDLE_FS_USE_POLLING` env variable
- Hide `node_modules` files from compiled messages

## 3.2.4

- Show successfully compiled files (#360)
- Fix errors when `.motion/state.js` is empty (#359)
- Automatically create compile cache on startup (#351)

## 3.2.1
 - motion-style Dynamic themes

## 3.2.0
 - Add parent styles through @style.parent
 - Fix media queries

## 3.1.0
 - Add themeProps as an option to styles, allowing boolean themes
 - Add dynamic style support

## 3.0.2
 - Add .css() support to objects passed in as values to motion-nice-style (and motion-style)

## 3.0.0

- Add themes and use static styles `motion-style` (**API BREAKING**)

## 2.0.0

- Simplify babel-preset by importing `babel-preset-react` (**API BREAKING**)
- Remove `$` support in import, in favor of auto-replacement in atom package (**API BREAKING**)

## 1.4.1

- Add support for `babel.plugins` in `.motion/config.json`
- Bump pundle to 0.2.15

## 1.4.0

( Skipped 1.3.0 because a version of `motion-nice-styles` already existed with that version, wat? )

- Set `process.env.NODE_ENV` properly
- Bump pundle to 0.2.14
- Update `reload` message, change `successfully` to `peacefully` :ok:

## 1.2.0

- Nuke motion-fs
- Nuke motion-runtime
- Fix a bug where auto-installer won't work for `react` and `react-dom`
- Fix a bug where babel's invalid source mappings would halt the execution

## 1.1.0

- Initial Public Stable release
