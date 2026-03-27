import type { IconProps } from '../../types';
export const Money = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M1 3.5H3V4.5H2V5.5H1V3.5ZM1 6.5H2V5.5H14V6.5H15V12.5H14V11.5H13V10.5H14V7.5H13V6.5H3V7.5H2V10.5H3V11.5H2V12.5H1V6.5ZM3 7.5H5V8.5H4V9.5H5V10.5H3V7.5ZM3 11.5H13V12.5H3V11.5ZM4 3.5H12V4.5H4V3.5ZM6 7.5H10V10.5H6V7.5ZM11 7.5H13V10.5H11V9.5H12V8.5H11V7.5ZM13 3.5H15V5.5H14V4.5H13V3.5Z" /></svg>;
Money.displayName = 'Money';

export default Money;
