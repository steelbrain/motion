export type Identifier = [
  component:? Function,
  name: string,
  key: number,
  repeatItem: any,
  index: number
]

export type Element = {
  name: string;
  tagName: string;
  key: number;
  index: number;
  repeatItem: any;
  component: Function;
  whitelisted: boolean;
  isView: boolean;
}
