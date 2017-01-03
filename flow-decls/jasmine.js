/* @flow */

declare function it(name: string, callback: (() => void)): void;
declare function fit(name: string, callback: (() => void)): void;
declare function expect(value: any): Object;
declare function describe(name: string, callback: (() => void)): void;

declare class Error {
  name: string;
  code: string;
  stack: string;
  message: string;
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  constructor: ((message: ?string, fileName: ?string, lineNumber: ?number) => this);
  toSource(): string;
  toString(): string;
}
