import type { IconProps } from '../../types';
export const InfoFilled = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 6H3V4H4V3H6V2H10V3H12V4H13V6H14V10H13V12H12V13H10V14H6V13H4V12H3V10H2V6ZM6 7V8H7V12H10V11H9V7H6ZM7 4V6H9V4H7Z" /></svg>;
InfoFilled.displayName = 'InfoFilled';

export default InfoFilled;
