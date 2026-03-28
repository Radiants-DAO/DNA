import type { IconProps } from '../../types';
export const Tape = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M1 4.5H2V3.5H14V4.5H15V11.5H14V12.5H12V11.5H11V10.5H5V11.5H4V12.5H2V11.5H1V4.5ZM14 11.5V10.5H13V11.5H14ZM2 11.5H3V10.5H2V11.5ZM2 5.5V8.5H3V9.5H6V8.5H7V9.5H9V8.5H10V9.5H13V8.5H14V5.5H13V4.5H10V5.5H9V4.5H7V5.5H6V4.5H3V5.5H2ZM3 6.5H4V7.5H3V6.5ZM4 5.5H5V6.5H4V5.5ZM4 7.5H5V8.5H4V7.5ZM5 6.5H6V7.5H5V6.5ZM5 11.5H11V12.5H5V11.5ZM7 6.5H9V7.5H7V6.5ZM10 6.5H11V7.5H10V6.5ZM11 5.5H12V6.5H11V5.5ZM11 7.5H12V8.5H11V7.5ZM12 6.5H13V7.5H12V6.5Z" /></svg>;
Tape.displayName = 'Tape';

export default Tape;
