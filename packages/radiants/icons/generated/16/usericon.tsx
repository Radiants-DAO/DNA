import type { IconProps } from '../../types';
export const Usericon = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 3H3V2H13V3H14V13H13V14H9V12H7V11H6V14H3V13H2V3ZM7 11H11V9H12V4H11V3H6V4H5V8H6V10H7V11ZM8 6H9V7H8V6ZM10 6H11V7H10V6Z" /></svg>;
Usericon.displayName = 'Usericon';

export default Usericon;
