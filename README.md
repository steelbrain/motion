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

<p align="center">
  <a href="http://issuestats.com/github/motion/motion"><img alt="Issue Stats" src="http://issuestats.com/github/motion/motion/badge/pr?style=flat"></a>
  <a href="http://issuestats.com/github/motion/motion"><img alt="Issue Stats" src="http://issuestats.com/github/motion/motion/badge/issue?style=flat"></a>
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

To build your app bundle

```bash
motion build
```

## Features

Motion gives you a [vorpal](https://github.com/dthree/vorpal) powered CLI that is built
to automate a few painful things with building modern web apps:

- Startup - Motion creates all the files you need to start from package.json to gitignore to index.html.
- Running - A consistent interface runs your app server and builds your files
- Configuring - Use your own configuration for babel.
- Hot reloads - Hot reloads come out of the box, powered by [pundle](https://github.com/motion/pundle)
- Testing - **Pending**

## Status

Motion is in early development. It's foundation is solid and it was designed out of real-world use cases.
But, it's currently powered by our own bundler, which means you may not want to use it yet.

The bundler, pundle, was born out of a number of frustrations with Webpack. We wanted auto-installing
npm dependencies that worked better than [the current best](https://github.com/ericclemmons/npm-install-webpack-plugin), but we couldn't get around certain API's. As we dug in further, we found a variety of problems.

Another big thing we wanted was faster hot reloads. Webpack on our medium size project was taking about 400ms. We got it down to nearly instant.

Finally, we just wanted a nice bundler that's code was self-documenting, typed, and had a foundation that would allow for extensibility. The result is [Pundle](https://github.com/motion/pundle), the peaceful bundler. It still needs some love: documentation, node_module watching, and code splitting for example. But we use daily at our company of four and we all love it.
