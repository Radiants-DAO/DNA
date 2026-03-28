import type { IconProps } from '../../types';
export const Camera = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M1 6H2V5H3V4H5V5H6V6H5V7H1V6ZM3 5V6H4V5H3ZM1 8H4V10H5V11H6V12H2V11H1V8ZM5 7H6V10H5V7ZM6 6H7V7H6V6ZM6 10H7V11H6V10ZM7 5H10V6H7V5ZM7 11H10V12H7V11ZM8 8H9V9H8V8ZM10 6H11V7H10V6ZM10 10H11V11H10V10ZM11 5H14V6H15V7H12V6H11V5ZM11 7H12V10H11V7ZM11 11H12V10H14V8H15V11H14V12H11V11Z" /></svg>;
Camera.displayName = 'Camera';

export default Camera;
