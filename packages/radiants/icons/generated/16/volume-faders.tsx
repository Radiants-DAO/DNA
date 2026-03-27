import type { IconProps } from '../../types';
export const VolumeFaders = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 6H5V7H2V6ZM3 3H4V5H3V3ZM3 8H4V13H3V8ZM5 9H8V10H5V9ZM6 3H7V8H6V3ZM6 11H7V13H6V11ZM8 7H11V8H8V7ZM9 3H10V6H9V3ZM9 9H10V13H9V9ZM11 5H14V6H11V5ZM12 3H13V4H12V3ZM12 7H13V13H12V7Z" /></svg>;
VolumeFaders.displayName = 'VolumeFaders';

export default VolumeFaders;
