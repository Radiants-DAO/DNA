import type { IconProps } from '../../types';
export const MoreHorizontal = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><g fill="currentColor"><path d="M3 7H5V9H3zM7 7H9V9H7zM11 7H13V9H11z" /></g></svg>;
MoreHorizontal.displayName = 'MoreHorizontal';

export default MoreHorizontal;
