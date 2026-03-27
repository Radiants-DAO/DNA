import type { IconProps } from '../../types';
export const GripVertical = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><g fill="currentColor"><path d="M11 3H13V5H11z" transform="rotate(90 11 3)" /><path d="M11 7H13V9H11z" transform="rotate(90 11 7)" /><path d="M11 11H13V13H11z" transform="rotate(90 11 11)" /><path d="M7 3H9V5H7z" transform="rotate(90 7 3)" /><path d="M7 7H9V9H7z" transform="rotate(90 7 7)" /><path d="M7 11H9V13H7z" transform="rotate(90 7 11)" /></g></svg>;
GripVertical.displayName = 'GripVertical';

export default GripVertical;
