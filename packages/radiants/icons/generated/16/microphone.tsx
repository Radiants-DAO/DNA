import type { IconProps } from '../../types';
export const Microphone = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M4 7.5H5V9.5H4V7.5ZM5 9.5H6V10.5H5V9.5ZM6 3.5H7V4.5H6V3.5ZM6 5.5H7V6.5H6V5.5ZM6 7.5H7V6.5H9V7.5H10V9.5H9V10.5H7V9.5H6V7.5ZM6 10.5H7V11.5H6V10.5ZM6 12.5H7V11.5H9V12.5H10V13.5H6V12.5ZM7 2.5H9V3.5H7V2.5ZM7 4.5H9V5.5H7V4.5ZM9 3.5H10V4.5H9V3.5ZM9 5.5H10V6.5H9V5.5ZM9 10.5H10V11.5H9V10.5ZM10 9.5H11V10.5H10V9.5ZM11 7.5H12V9.5H11V7.5Z" /></svg>;
Microphone.displayName = 'Microphone';

export default Microphone;
