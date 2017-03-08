/* @flow */

import FS from 'sb-fs'
import Path from 'path'
import Pundle from 'pundle'
import { createPlugin } from 'pundle-api'
import { CompositeDisposable } from 'sb-event-kit'
import type { GeneratorResult } from 'pundle-api/types'
import type { Config } from './types'

export default class Compilation {
  config: Config;
  projectPath: string;
  subscriptions: CompositeDisposable;
  constructor(config: Config, projectPath: string) {
    this.config = config
    this.projectPath = projectPath
    this.subscriptions = new CompositeDisposable()
  }
  async watch(useCache: boolean): Promise<void> {
    console.log('useCache', useCache)
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

      presets: [[require.resolve('pundle-preset-default'), {
        generator: {
          pathType: this.config.pathType === 'number' ? 'number' : 'filePath',
        },
        reporter: {
          // TODO: Enable this
          // log: o => cli.log(o),
        },
      }], ...this.config.pundle.presets],

      components: [
        require.resolve('pundle-plugin-dedupe'),
        require.resolve('pundle-plugin-commons-chunk'),
        [require.resolve('pundle-plugin-npm-installer'), {
          save: this.config.saveNpmModules,
          beforeInstall(name) {
            // TODO: Enable this
            // if (terminal) {
            //   const message = `Installing ${name}`
            //   cli.addSpinner(message)
            // }
            console.log('installing', name)
          },
          afterInstall(name) {
            // TODO: Enable this
            // if (terminal) {
            //   const message = `Installing ${name}`
            //   cli.removeSpinner(message)
            //   // ^ To insert a new line to allow default logger of Pundle to output
            // } else if (error) {
            //   errorCallback(error)
            // }
            console.log('installed', name)
          },
          extensions: ['js'],
        }],
        [require.resolve('pundle-transformer-babel'), {
          babelPath: require.resolve('babel-core'),
          config: this.config.babel,
          extensions: ['js'],
        }],
        createPlugin(function(_: Object, file: Object) {
          // if (development) {
          //   if ((file.filePath.indexOf(projectPath) === 0 && file.filePath.indexOf('node_modules') === -1) || process.env.MOTION_DEBUG_TICK_ALL) {
          //     const relative = Path.relative(projectPath, file.filePath)
          //     cli.log(`${chalk.dim(Path.join('$root', relative.substr(0, 2) === '..' ? file.filePath : relative))} ${chalk.green(TICK)}`)
          //   }
          // }
          console.log('tick', file.filePath)
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
  dispose() {
    this.subscriptions.dispose()
  }
}
