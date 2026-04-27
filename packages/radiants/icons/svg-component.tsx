import { createElement, type ComponentType } from 'react';

import type { IconProps, IconSet } from './types';

interface SvgIconDefinition {
  readonly name: string;
  readonly set: IconSet;
  readonly viewBox: string;
  readonly body: string;
}

export function createSvgIcon(definition: SvgIconDefinition): ComponentType<IconProps> {
  function SvgIcon({
    name: _name,
    size = definition.set,
    large: _large,
    basePath: _basePath,
    className = '',
    ...props
  }: IconProps) {
    return createElement('svg', {
      ...props,
      width: size,
      height: size,
      viewBox: definition.viewBox,
      fill: 'currentColor',
      className,
      focusable: props.focusable ?? false,
      dangerouslySetInnerHTML: { __html: definition.body },
    });
  }

  SvgIcon.displayName = definition.name;

  return SvgIcon;
}
