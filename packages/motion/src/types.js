/* @flow */

export type Config = {
  babel: {
    plugins: Array<string | [string, Object]>,
    presets: Array<string>
  },
  pundle: {
    presets: Array<string>,
    components: Array<string>,
  },
  pathType: 'filePath' | 'number',
  saveNpmModules: boolean,
  webServerPort: number,
  rootDirectory: string,
  outputDirectory: string,
}
