import type { IconProps } from '../../types';
export const Joystick = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M3 13H4V12H12V13H13V14H3V13ZM6 3H7V2H9V3H10V5H9V6H7V5H6V3ZM9 3H8V4H9V3ZM7 7H9V11H7V7Z" /></svg>;
Joystick.displayName = 'Joystick';

export default Joystick;
