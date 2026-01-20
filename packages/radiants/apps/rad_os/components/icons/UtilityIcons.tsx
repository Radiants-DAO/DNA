/**
 * Utility Icon Components
 * Icons that use the dynamic Icon loader for UI elements
 */

import React from 'react';
import { Icon } from './Icon';

interface IconProps {
  className?: string;
  size?: number | string;
}

export function CloseIcon({ className = '', size = 10 }: IconProps) {
  return <Icon name="close" size={typeof size === 'number' ? size : parseInt(String(size))} className={className} />;
}

export function CopyIcon({ className = '', size = 18 }: IconProps) {
  return <Icon name="copy-to-clipboard" size={typeof size === 'number' ? size : parseInt(String(size))} className={className} />;
}

export function CopiedIcon({ className = '', size = 18 }: IconProps) {
  return <Icon name="copied-to-clipboard" size={typeof size === 'number' ? size : parseInt(String(size))} className={className} />;
}

export function HelpIcon({ className = '', size = 16 }: IconProps) {
  return <Icon name="question" size={typeof size === 'number' ? size : parseInt(String(size))} className={className} />;
}

export function ComponentsIcon({ className = '', size = 16 }: IconProps) {
  return <Icon name="wrench" size={typeof size === 'number' ? size : parseInt(String(size))} className={className} />;
}
