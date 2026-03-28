import type { IconProps } from '../../types';
export const Moon = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M9 2.5H8V3.5H7V4.5H6V8.5H7V9.5H8V10.5H12V9.5H13V8.5H14V7.5H15V10.5H14V11.5H13V12.5H12V13.5H10V14.5H6V13.5H4V12.5H3V11.5H2V10.5H1V5.5H2V4.5H3V3.5H4V2.5H6V1.5H9V2.5Z" /></svg>;
Moon.displayName = 'Moon';

export default Moon;
