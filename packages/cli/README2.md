### Installation

See http://flintjs.com for full docs!

Installation is done through npm script or npm:

```
sh <(curl -sL https://flint.love)
```

or

```
npm install -g flint
```

Generate a new base Flint stack with:

```
flint new [name]
```

And finally in your app directory, run it on [localhost:3010](http://localhost:3010):

```
flint run
```

### CLI

The CLI has three main functions: creating new apps, running them, and building them for release.

Note that when you run your app, it will run in development mode by default which is much slower
but easier to debug. Run it in production mode to get a feel for real-world performance.

CLI Usage:
```
Usage: flint [command]

  new [name]  creates a directory with a new Flint-starter scaffold
  run         runs a Flint application with express/webpack-dev-server
  build       builds a Flint application to a bundle in ./build
  debug       use this for opening issues!
```

The build and run commands take a variety of options to help ease your development, such as:

```
Usage: flint-run [options]

  -d, --debug          output extra information for debugging
  -p, --port [number]  specify a port [number]
  -h, --host [host]    specify hostname
  -b, --bind [address] specify bind address if different from host
  -e, --env [env]      specify an enivornment
  -t, --tool [tool]    specify a webpack devtool
```

```
Usage: flint-build [options]

  -d, --debug  output extra information for debugging
  --no-assets  only build the js
  --no-js      only build the assets
```
