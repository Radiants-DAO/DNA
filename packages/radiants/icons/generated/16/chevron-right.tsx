import type { IconProps } from '../../types';
export const ChevronRight = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M4 1H6V2H7V3H8V4H9V5H10V6H11V7H12V9H11V10H10V11H9V12H8V13H7V14H6V15H4V13H5V12H6V11H7V10H8V9H9V7H8V6H7V5H6V4H5V3H4V1Z" /></svg>;
ChevronRight.displayName = 'ChevronRight';

export default ChevronRight;
