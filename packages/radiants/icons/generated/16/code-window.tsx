import type { IconProps } from '../../types';
export const CodeWindow = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M1 3H15V13H1V3ZM2 5V12H14V5H2ZM4 6H5V7H4V6ZM4 10H5V11H4V10ZM5 7H6V8H5V7ZM5 9H6V10H5V9ZM6 8H7V9H6V8ZM8 10H12V11H8V10Z" /></svg>;
CodeWindow.displayName = 'CodeWindow';

export default CodeWindow;
