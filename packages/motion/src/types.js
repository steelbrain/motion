/* @flow */

export type Config = {
  babel: {
    plugins: Array<string | [string, Object]>,
    presets: Array<string>
  },
  pathType: 'filePath' | 'number',
  webServerPort: number,
  saveNpmModules: boolean,
  bundleDirectory: string,
  publicDirectory: string,
  includePolyfills: boolean,
}
