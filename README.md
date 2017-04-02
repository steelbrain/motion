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
  </a><br/>
  <a href="https://app.fossa.io/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Fmotion%2Fmotion?ref=badge_large" alt="FOSSA Status"><img src="https://app.fossa.io/api/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Fmotion%2Fmotion.svg?size=large"/></a>
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
      "babel-plugin-jsx-if"
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

- **pathType**: `"filePath" | "number"` Use number to mimic production build short paths in your build.
- **bundleDirectory**: `string` Entry directory to your app (looks for index.js file there)
- **publicDirectory**: `string` Entry to your static assets (looks for index.html there)

Customize your package.json to use motion:

```json
{
  "scripts": {
    "start": "motion",
    "build": "motion build"
  }
}
```

The default babel settings, `babel-preset-motion`:

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

## Project structure

Motion apps are kept very simple on purpose. This allows motion to be lightweight, which lets you plug motion apps into bigger apps easily. By default you just need:

```
  .motion.js
  index.js
  public/
    index.html
```

You can see an example of the initial structure by running `motion new app`.

## Running linting, flow, tests

Motion is not opinionated on these but also doesn't get in your way. You can easily drop in an eslint file, flow config, and test suite of your choosing. An example of a more mature starting point that uses motion, flow, eslint and lerna [is right here](https://github.com/motion/starter).

## More information

Motion uses pundle behind the scenes to provide lightning fast hot module reloads and a nice foundation for adding really advancted features. [Read more about pundle here](https://github.com/motion/pundle).

## Contributing

Clone the repo and run these two commands for initial setup

```
 $ npm install
 $ npm run bootstrap
```

Then run either the `watch` or the `compile` npm scripts depending on the occasion.

After running those for the first time, make sure to link in the cli by running `cd packages/motion; npm link`. You can then use the `motion` cli (presuming you've added npm bin path to your PATH env var).

## License

This project is licensed under the terms of MIT License. See the LICENSE file for more info.
