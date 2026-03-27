import type { IconProps } from '../../types';
export const Trophy = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 3H4V4H3V6H2V3ZM3 6H4V7H3V6ZM5 2H11V8H10V9H9V12H10V13H11V14H5V13H6V12H7V9H6V8H5V2ZM12 3H14V6H13V4H12V3ZM12 6H13V7H12V6Z" /></svg>;
Trophy.displayName = 'Trophy';

export default Trophy;
