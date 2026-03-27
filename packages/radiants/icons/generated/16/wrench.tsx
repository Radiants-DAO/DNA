import type { IconProps } from '../../types';
export const Wrench = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 12H3V13H4V14H2V12ZM3 11H4V10H5V9H6V8H7V7H8V3H9V2H11V3H10V4H9V5H10V6H11V7H12V6H13V5H14V7H13V8H9V9H8V10H7V11H6V12H5V13H4V12H3V11Z" /></svg>;
Wrench.displayName = 'Wrench';

export default Wrench;
