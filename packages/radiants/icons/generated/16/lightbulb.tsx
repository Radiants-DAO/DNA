import type { IconProps } from '../../types';
export const Lightbulb = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M4 3.5H5V2.5H6V1.5H10V2.5H9V3.5H10V4.5H11V3.5H12V7.5H11V8.5H10V10.5H6V8.5H5V7.5H4V3.5ZM6 11.5H10V12.5H6V11.5ZM6 13.5H10V14.5H6V13.5ZM10 2.5H11V3.5H10V2.5Z" /></svg>;
Lightbulb.displayName = 'Lightbulb';

export default Lightbulb;
