/* @flow */

import FS from 'sb-fs'
import Path from 'path'
import chalk from 'chalk'
import Pundle from 'pundle'
import PundleDevServer from 'pundle-dev'
import { createPlugin } from 'pundle-api'
import { CompositeDisposable } from 'sb-event-kit'
import type { GeneratorResult } from 'pundle-api/types'

import CLI from './cli'
import { TICK, normalizeBabelConfig, getNpmErrorMessage } from './helpers'
import type { Config, Options } from './types'

export default class Compilation {
  cli: CLI;
  config: Config;
  options: Options;
  projectPath: string;
  subscriptions: CompositeDisposable;
  constructor(projectPath: string, config: Config, options: Options) {
    this.cli = new CLI(projectPath, config, options)
    this.config = config
    this.options = options
    this.projectPath = projectPath
    this.subscriptions = new CompositeDisposable()

    this.cli.onShouldBuild(() => this.build(this.options.useCache))
  }
  async watch(useCache: boolean): Promise<void> {
    const pundle = await this.getPundle(true)
    const server = new PundleDevServer(pundle, {
      port: this.config.webServerPort,
      rootDirectory: this.config.outputDirectory,
      hmrPath: '/_/bundle_hmr',
      bundlePath: '/_/bundle.js',
      useCache,
      publicPath: '/',
      sourceMapPath: '/_/bundle.js.map',
      redirectNotFoundToIndex: true,
    })
    this.subscriptions.add(server)
    if (process.stdout.isTTY) {
      this.cli.activate()
    }
    await server.activate()
  }
  async build(useCache: boolean): Promise<void> {
    const pundle = await this.getPundle(false)
    const outputs = await pundle.generate(await pundle.build(useCache), {
      sourceMap: false,
    })
    await this.writeToDisk(outputs)
  }
  async writeToDisk(outputs: Array<GeneratorResult>): Promise<void> {
    const pundle = await this.getPundle()
    const outputDirectory = this.config.outputDirectory

    await FS.mkdirp(Path.join(outputDirectory, '_'))
    await Promise.all(outputs.map(function(output) {
      return FS.writeFile(Path.join(outputDirectory, '_', `bundle.${output.chunk.label}.js`), output.contents)
    }))

    const indexHtmlSource = Path.join(this.projectPath, 'index.html')
    const indexHtmlTarget = Path.join(outputDirectory, 'index.html')
    const indexHtml = pundle.fill(await FS.readFile(indexHtmlSource, 'utf8'), outputs.map(o => o.chunk), {
      publicRoot: pundle.config.output.publicRoot,
      bundlePath: pundle.config.output.bundlePath,
    })
    await FS.writeFile(indexHtmlTarget, indexHtml)
  }
  async getPundle(development: boolean = false): Promise<Object> {
    return await Pundle.create({
      entry: ['./'],
      debug: this.options.debug,

      presets: [[require.resolve('pundle-preset-default'), {
        generator: {
          pathType: this.config.pathType === 'number' ? 'number' : 'filePath',
        },
        reporter: {
          log: o => this.log(o),
        },
      }], ...this.config.pundle.presets],

      components: [
        [require.resolve('pundle-plugin-dedupe'), {
          debug: this.options.debugDedupe,
        }],
        require.resolve('pundle-plugin-commons-chunk'),
        [require.resolve('pundle-plugin-npm-installer'), {
          save: this.config.saveNpmModules,
          silent: true,
          beforeInstall: (name) => {
            if (!development) {
              return
            }
            this.cli.addSpinner(`Installing ${name}`)
          },
          afterInstall: (name, error) => {
            if (!development) {
              return
            }
            this.cli.removeSpinner(`Installing ${name}`)
            if (error) {
              this.log(`Failed to install ${name} because ${getNpmErrorMessage(error.message)}`)
            } else {
              this.log(`Successfully installed ${name}`)
            }
          },
          extensions: ['js'],
        }],
        [require.resolve('pundle-transformer-babel'), {
          babelPath: require.resolve('babel-core'),
          config: await normalizeBabelConfig(this.projectPath, this.config.babel),
          extensions: ['js'],
        }],
        createPlugin((_: Object, __: Object, file: Object) => {
          if (!development) {
            return
          }
          if (this.options.debugTickAll || (file.filePath.indexOf(this.projectPath) === 0 && file.filePath.indexOf('node_modules') === -1)) {
            const relative = Path.relative(this.projectPath, file.filePath)
            this.log(`${chalk.dim(Path.join('$root', relative))} ${chalk.green(TICK)}`)
          }
        }),
        ...this.config.pundle.components,
      ],

      output: {
        bundlePath: 'bundle.js',
        publicRoot: '/_/',
      },
      rootDirectory: this.projectPath,
      replaceVariables: {
        'process.env.NODE_ENV': JSON.stringify(development ? 'development' : 'production'),
      },
    })
  }
  log(contents: string): void {
    this.cli.log(contents)
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
