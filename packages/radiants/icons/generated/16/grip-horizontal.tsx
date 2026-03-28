import type { IconProps } from '../../types';
export const GripHorizontal = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><g fill="currentColor"><path d="M3 5H5V7H3zM7 5H9V7H7zM11 5H13V7H11zM3 9H5V11H3zM7 9H9V11H7zM11 9H13V11H11z" /></g></svg>;
GripHorizontal.displayName = 'GripHorizontal';

export default GripHorizontal;
