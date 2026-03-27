import type { IconProps } from '../../types';
export const CommentsTyping = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 12.5H3V13.5H2V12.5ZM3 10.5H4V3.5H5V2.5H13V3.5H14V10.5H13V11.5H5V12.5H3V10.5ZM5 6.5V7.5H6V6.5H5ZM7 6.5V7.5H8V6.5H7ZM9 6.5V7.5H10V6.5H9ZM11 6.5V7.5H12V6.5H11Z" /></svg>;
CommentsTyping.displayName = 'CommentsTyping';

export default CommentsTyping;
