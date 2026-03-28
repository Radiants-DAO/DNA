import type { IconProps } from '../../types';
export const BroadcastDish = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 13H3V12H4V13H5V14H2V13ZM3 6H4V5H5V7H6V8H7V9H8V10H9V11H11V12H10V13H5V12H4V11H3V6ZM8 2H12V3H8V2ZM8 7H9V8H8V7ZM9 4H11V5H9V4ZM9 6H10V7H9V6ZM11 5H12V7H11V5ZM12 3H13V4H12V3ZM13 4H14V8H13V4Z" /></svg>;
BroadcastDish.displayName = 'BroadcastDish';

export default BroadcastDish;
