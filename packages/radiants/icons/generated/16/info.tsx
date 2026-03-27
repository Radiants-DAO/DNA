import type { IconProps } from '../../types';
export const Info = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M6 3H7V2H9V3H10V4H9V5H7V4H6V3ZM6 7H9V13H10V14H7V8H6V7Z" /></svg>;
Info.displayName = 'Info';

export default Info;
