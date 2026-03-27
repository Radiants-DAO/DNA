import type { IconProps } from '../../types';
export const CellBars = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2.5 9H4.5V13H2.5V9ZM5.5 7H7.5V13H5.5V7ZM8.5 5H10.5V13H8.5V5ZM11.5 3H13.5V13H11.5V3Z" /></svg>;
CellBars.displayName = 'CellBars';

export default CellBars;
