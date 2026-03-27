import type { IconProps } from '../../types';
export const OutlineBox = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M3 3H7V4H4V7H3V3ZM3 9H4V12H7V13H3V9ZM9 3H13V7H12V4H9V3ZM9 12H12V9H13V13H9V12Z" /></svg>;
OutlineBox.displayName = 'OutlineBox';

export default OutlineBox;
