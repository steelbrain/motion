/* @flow */

export type Installer$Config = {
  save?: boolean,
  onStarted?: ((jobID: number, dependencies: Array<Array<string>>) => any),
  onProgress?: ((jobID: number, name: string, error: ?Error) => any),
  onComplete?: ((jobID: number) => any)
}
