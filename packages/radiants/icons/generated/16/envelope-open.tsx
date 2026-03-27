import type { IconProps } from '../../types';
export const EnvelopeOpen = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 6H4V5H6V4H7V3H9V4H10V5H12V6H14V7H2V6ZM2 8H4V9H6V10H5V11H4V12H3V13H2V8ZM4 12H5V11H6V10H7V9H9V10H10V11H11V12H12V13H4V12ZM10 9H12V8H14V13H13V12H12V11H11V10H10V9Z" /></svg>;
EnvelopeOpen.displayName = 'EnvelopeOpen';

export default EnvelopeOpen;
