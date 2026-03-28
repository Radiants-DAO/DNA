import type { IconProps } from '../../types';
export const Hourglass = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M4 1.5H12V2.5H4V1.5ZM4 13.5H12V14.5H4V13.5ZM5 3.5H6V4.5H7V5.5H6V6.5H5V3.5ZM5 9.5H6V12.5H5V9.5ZM6 6.5H7V7.5H6V6.5ZM6 8.5H7V9.5H6V8.5ZM7 5.5H8V6.5H7V5.5ZM7 7.5H8V6.5H9V5.5H8V4.5H10V3.5H11V6.5H10V7.5H9V8.5H7V7.5ZM9 8.5H10V9.5H9V8.5ZM10 9.5H11V12.5H10V9.5Z" /></svg>;
Hourglass.displayName = 'Hourglass';

export default Hourglass;
