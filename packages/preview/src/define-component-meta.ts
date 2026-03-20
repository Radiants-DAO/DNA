import type { ComponentMeta } from "./types";

export function defineComponentMeta<TProps>() {
  return <TMeta extends ComponentMeta<TProps>>(meta: TMeta) => meta;
}
