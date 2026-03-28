import type { IconProps } from '../../types';
export const LockClosed = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M3 8H13V13H12V14H4V13H3V8ZM7 10V12H8V13H9V10H7ZM5 3H6V2H10V3H11V7H10V4H9V3H7V4H6V7H5V3Z" /></svg>;
LockClosed.displayName = 'LockClosed';

export default LockClosed;
