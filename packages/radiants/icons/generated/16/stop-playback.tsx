import type { IconProps } from '../../types';
export const StopPlayback = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M3.5 3.5H12.5V12.5H3.5V3.5Z" /></svg>;
StopPlayback.displayName = 'StopPlayback';

export default StopPlayback;
