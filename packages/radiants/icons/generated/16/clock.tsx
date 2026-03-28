import type { IconProps } from '../../types';
export const Clock = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M1.5 6.5H2.5V4.5H3.5V3.5H4.5V2.5H6.5V1.5H9.5V2.5H11.5V3.5H12.5V4.5H13.5V6.5H14.5V9.5H13.5V11.5H12.5V12.5H11.5V13.5H9.5V14.5H6.5V13.5H4.5V12.5H3.5V11.5H2.5V9.5H1.5V6.5ZM3.5 5.5V10.5H4.5V11.5H5.5V12.5H10.5V11.5H11.5V10.5H12.5V5.5H11.5V4.5H10.5V3.5H5.5V4.5H4.5V5.5H3.5ZM7.5 4.5H8.5V7.5H10.5V8.5H7.5V4.5Z" /></svg>;
Clock.displayName = 'Clock';

export default Clock;
