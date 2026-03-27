import type { IconProps } from '../../types';
export const Trash = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2.5 4H5.5V3H6.5V4H9.5V3H10.5V4H13.5V5H2.5V4ZM3.5 6H12.5V13H11.5V14H4.5V13H3.5V6ZM4.5 7V12H5.5V7H4.5ZM6.5 7V12H7.5V7H6.5ZM8.5 7V12H9.5V7H8.5ZM10.5 7V12H11.5V7H10.5ZM6.5 2H9.5V3H6.5V2Z" /></svg>;
Trash.displayName = 'Trash';

export default Trash;
