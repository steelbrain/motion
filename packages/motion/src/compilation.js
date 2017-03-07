/* @flow */

import FS from 'sb-fs'
import Path from 'path'
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
    console.log('useCache', useCache)
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
  async getPundle(): Promise<Object> {
    return {}
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
