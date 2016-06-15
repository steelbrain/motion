# Changelog

## Upcoming

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
