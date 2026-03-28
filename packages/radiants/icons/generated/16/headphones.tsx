import type { IconProps } from '../../types';
export const Headphones = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 10H3V6H4V9H5V13H3V12H2V10ZM4 5H5V6H4V5ZM5 4H6V3H10V4H11V5H5V4ZM11 5H12V6H11V5ZM11 9H12V6H13V10H14V12H13V13H11V9Z" /></svg>;
Headphones.displayName = 'Headphones';

export default Headphones;
