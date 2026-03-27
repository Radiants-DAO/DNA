import type { IconProps } from '../../types';
export const Share = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 4H3V3H7V4H4V5H3V12H4V13H12V12H13V9H14V13H13V14H3V13H2V4ZM6 7H7V6H8V5H9V4H11V2H12V3H13V4H14V6H13V7H12V8H11V6H9V7H8V8H7V10H6V7Z" /></svg>;
Share.displayName = 'Share';

export default Share;
