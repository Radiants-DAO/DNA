import type { IconProps } from '../../types';
export const Close = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2.5 2.5H4.5V3.5H5.5V4.5H6.5V5.5H9.5V4.5H10.5V3.5H11.5V2.5H13.5V4.5H12.5V5.5H11.5V6.5H10.5V9.5H11.5V10.5H12.5V11.5H13.5V13.5H11.5V12.5H10.5V11.5H9.5V10.5H6.5V11.5H5.5V12.5H4.5V13.5H2.5V11.5H3.5V10.5H4.5V9.5H5.5V6.5H4.5V5.5H3.5V4.5H2.5V2.5Z" /></svg>;
Close.displayName = 'Close';

export default Close;
