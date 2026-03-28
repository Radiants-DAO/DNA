import type { IconProps } from '../../types';
export const WarningFilled = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 11H3V9H4V7H5V5H6V8H7V10H9V8H10V5H11V7H12V9H13V11H14V13H13V14H3V13H2V11ZM7 11V13H9V11H7ZM6 3H7V2H9V3H10V5H9V4H7V5H6V3Z" /></svg>;
WarningFilled.displayName = 'WarningFilled';

export default WarningFilled;
