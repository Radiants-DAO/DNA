declare module 'query-selector-shadow-dom' {
  export function querySelectorDeep(selector: string, root?: Document | Element): Element | null;
  export function querySelectorAllDeep(
    selector: string,
    root?: Document | Element
  ): NodeListOf<Element>;
  export function collectAllElementsDeep(
    selector?: string,
    root?: Document | Element
  ): Element[];
}
