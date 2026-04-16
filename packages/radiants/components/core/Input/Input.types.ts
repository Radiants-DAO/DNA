export type InputSize = 'sm' | 'md' | 'lg';

export interface InputShellProps {
  size?: InputSize;
  error?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export type TextAreaShellProps = Omit<InputShellProps, 'size'>;

export const sharedInputShellMetaProps = {
  error: {
    type: 'boolean',
    default: false,
    description: 'Shows error state styling',
  },
  fullWidth: {
    type: 'boolean',
    default: false,
    description: 'Makes the control take full container width',
  },
  disabled: {
    type: 'boolean',
    default: false,
    description: 'Disables the control',
  },
  placeholder: {
    type: 'string',
    description: 'Placeholder text',
  },
} as const;

export const inputSizeMetaProp = {
  type: 'enum',
  values: ['sm', 'md', 'lg'],
  default: 'md',
  description: 'Size preset for input height and padding',
} as const;
