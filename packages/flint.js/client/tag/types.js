export type Identifier = [
  component:? Function,
  name: string,
  key: number,
  repeatItem: any,
  index: number
]

export type Element = {
  name: string;
  key: number;
  index: number;
  repeatItem: any;
  component: Function;
  originalName: string;
  isView: boolean;
}
