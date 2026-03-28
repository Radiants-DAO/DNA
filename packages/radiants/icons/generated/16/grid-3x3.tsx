import type { IconProps } from '../../types';
export const Grid3X3 = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><g fill="currentColor"><path d="M3 3H5V5H3zM7 3H9V5H7zM11 3H13V5H11zM3 7H5V9H3zM7 7H9V9H7zM11 7H13V9H11zM3 11H5V13H3zM7 11H9V13H7zM11 11H13V13H11z" /></g></svg>;
Grid3X3.displayName = 'Grid3X3';

export default Grid3X3;
