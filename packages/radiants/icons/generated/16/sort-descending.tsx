import type { IconProps } from '../../types';
export const SortDescending = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2.5 10H3.5V11H2.5V10ZM3.5 11H4.5V3H5.5V11H6.5V12H5.5V13H4.5V12H3.5V11ZM6.5 10H7.5V11H6.5V10ZM8.5 5H10.5V6H8.5V5ZM8.5 7H11.5V8H8.5V7ZM8.5 9H12.5V10H8.5V9ZM8.5 11H13.5V12H8.5V11Z" /></svg>;
SortDescending.displayName = 'SortDescending';

export default SortDescending;
