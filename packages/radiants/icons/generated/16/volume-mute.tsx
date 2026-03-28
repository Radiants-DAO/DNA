import type { IconProps } from '../../types';
export const VolumeMute = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 6H4V10H2V6ZM5 5H6V4H7V3H8V13H7V12H6V11H5V5ZM9 5H10V6H9V5ZM9 9H10V10H9V9ZM10 6H11V7H10V6ZM10 8H11V9H10V8ZM11 7H12V8H11V7ZM12 6H13V7H12V6ZM12 8H13V9H12V8ZM13 5H14V6H13V5ZM13 9H14V10H13V9Z" /></svg>;
VolumeMute.displayName = 'VolumeMute';

export default VolumeMute;
