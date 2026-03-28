import type { IconProps } from '../../types';
export const ChevronLeft = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M12 1H10V2H9V3H8V4H7V5H6V6H5V7H4V9H5V10H6V11H7V12H8V13H9V14H10V15H12V13H11V12H10V11H9V10H8V9H7V7H8V6H9V5H10V4H11V3H12V1Z" /></svg>;
ChevronLeft.displayName = 'ChevronLeft';

export default ChevronLeft;
