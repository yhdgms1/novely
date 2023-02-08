declare global {
  namespace JSX {
    export type Element = HTMLElement;

    export interface ElementChildrenAttribute {
      children?: any;
    }

    export interface IntrinsicElements {
      [element: string]: any;
    }
  }
}

export { }