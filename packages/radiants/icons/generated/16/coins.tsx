import type { IconProps } from '../../types';
export const Coins = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M3 4H4V5H6V6H10V5H11V6H12V7H10V8H6V7H4V6H3V4ZM3 7H4V8H6V9H10V8H11V9H12V10H10V11H6V10H4V9H3V7ZM3 10H4V11H6V12H10V11H11V12H12V13H10V14H6V13H4V12H3V10ZM4 3H6V4H4V3ZM6 2L10 2V3H6V2ZM10 3H12V4H10V3ZM12 4H13V6H12V4ZM12 7H13V9H12V7ZM12 10H13V12H12V10Z" /></svg>;
Coins.displayName = 'Coins';

export default Coins;
