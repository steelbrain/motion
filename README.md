![Motion](https://raw.githubusercontent.com/motion/motion/master/o.jpg)

<p align="center">
  A simple CLI for running React projects.
</p>

<p align="center">
  For questions and support please visit the <a href="https://motion-slack.herokuapp.com">Slack community</a>!
</p>

<p align="center">
  <a href="http://badge.fury.io/js/motion"><img alt="npm version" src="https://badge.fury.io/js/motion.svg"></a>
  <a href="https://npmjs.org/package/motion"><img alt="Downloads" src="http://img.shields.io/npm/dm/motion.svg"></a>
  <a href="https://circleci.com/gh/motion/motion/tree/master">
    <img src="https://img.shields.io/circleci/project/motion/motion/master.svg" alt="CircleCI Build Status">
  </a>
</p>

----

## Installing

```bash
npm install -g motion
```

## Using the CLI

To create a new project:

```bash
motion new appname
```

To migrate an existing project, inside the dir:

```bash
motion init
```

To start your apps

```bash
cd app
motion
```

To build your production bundle:

```bash
motion build
```

## Features

Motion is a lightweight CLI for running any javascript. No configuration to mess with by default, yet completely flexible access to customize your plugins.

Comes with:

- Hot reloads - Hot reloads come out of the box, powered by [pundle](https://github.com/motion/pundle)
- Automatic NPM installs - typing an import installs packages and works with HMR
- Cached startup for really fast resuming of development

## Configuration

Using a `.motion.js` file in your app root:

```json
{
  "babel": {
    "plugins": [
      "motion-view/transform",
      "babel-plugin-jsx-if",
      ["gloss/transform", {
        "decoratorName": "view"
      }]
    ],
    "presets": [
      "babel-preset-motion"
    ]
  },
  "pathType": "filePath",
  "webServerPort": 4444,
  "saveNpmModules": true,
  "bundleDirectory": ".",
  "publicDirectory": "./public"
}
```

- `pathType`:

Customize your package.json to use motion:

```json
{
  "scripts": {
    "start": "motion",
    "build": "motion build"
  }
}
```

The default `babel-preset-motion` defines the following:

```js
{
  "presets": [
    "babel-preset-stage-0",
    "babel-preset-react"
  ],
  "plugins": [
    "babel-plugin-transform-decorators-legacy"
  ]
}
```


