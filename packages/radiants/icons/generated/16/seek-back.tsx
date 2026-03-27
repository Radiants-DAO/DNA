import type { IconProps } from '../../types';
export const SeekBack = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 7.5H3V6.5H4V5.5H5V4.5H6V3.5H8V6.5H7V7.5H6V8.5H7V9.5H8V12.5H6V11.5H5V10.5H4V9.5H3V8.5H2V7.5ZM8 7.5H9V6.5H10V5.5H11V4.5H12V3.5H14V12.5H12V11.5H11V10.5H10V9.5H9V8.5H8V7.5Z" /></svg>;
SeekBack.displayName = 'SeekBack';

export default SeekBack;
