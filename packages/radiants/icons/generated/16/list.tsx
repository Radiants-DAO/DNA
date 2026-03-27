import type { IconProps } from '../../types';
export const List = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 2.5H5V5.5H2V2.5ZM2 6.5H5V9.5H2V6.5ZM3 7.5V8.5H4V7.5H3ZM2 10.5H5V13.5H2V10.5ZM3 11.5V12.5H4V11.5H3ZM6 4.5H14V5.5H6V4.5ZM6 8.5H14V9.5H6V8.5ZM6 12.5H14V13.5H6V12.5Z" /></svg>;
List.displayName = 'List';

export default List;
