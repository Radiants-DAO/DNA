import type { IconProps } from '../../types';
export const Plus = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M3 7H7V3H9V7H13V9H9V13H7V9H3V7Z" /></svg>;
Plus.displayName = 'Plus';

export default Plus;
