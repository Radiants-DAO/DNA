import type { IconProps } from '../../types';
export const ChevronDown = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M1 4H3V5H4V6H5V7H6V8H7V9H9V8H10V7H11V6H12V5H13V4H15V6H14V7H13V8H12V9H11V10H10V11H9V12H7V11H6V10H5V9H4V8H3V7H2V6H1V4Z" /></svg>;
ChevronDown.displayName = 'ChevronDown';

export default ChevronDown;
