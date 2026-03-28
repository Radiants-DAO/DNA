import type { IconProps } from '../../types';
export const CursorText = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M3.5 2H6.5V3H3.5V2ZM3.5 13H6.5V14H3.5V13ZM6.5 3H9.5V4H8.5V12H9.5V13H6.5V12H7.5V4H6.5V3ZM9.5 2H12.5V3H9.5V2ZM9.5 13H12.5V14H9.5V13Z" /></svg>;
CursorText.displayName = 'CursorText';

export default CursorText;
