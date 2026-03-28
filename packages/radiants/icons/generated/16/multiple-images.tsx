import type { IconProps } from '../../types';
export const MultipleImages = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M3 3H11V11H3V3ZM4 8V10H10V9H9V8H8V7H7V6H6V7H5V8H4ZM8 5V6H9V5H8ZM5 12H12V5H13V13H5V12Z" /></svg>;
MultipleImages.displayName = 'MultipleImages';

export default MultipleImages;
