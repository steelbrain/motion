/* @flow */

export type Config = {
  babel: {
    plugins: Array<string>,
    presets: Array<string>
  },
  webServerPort: number,
  saveNpmModules: boolean,
  bundleDirectory: string,
  publicDirectory: string,
  includePolyfills: boolean,
}
