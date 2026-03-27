import type { IconProps } from '../../types';
export const Checkmark = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 7.5H4V8.5H5V9.5H7V8.5H8V7.5H9V6.5H10V5.5H11V4.5H12V3.5H14V5.5H13V6.5H12V7.5H11V8.5H10V9.5H9V10.5H8V11.5H7V12.5H5V11.5H4V10.5H3V9.5H2V7.5Z" /></svg>;
Checkmark.displayName = 'Checkmark';

export default Checkmark;
