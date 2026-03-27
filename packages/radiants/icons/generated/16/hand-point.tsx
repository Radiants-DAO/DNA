import type { IconProps } from '../../types';
export const HandPoint = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2.5 9H4.5V10H5.5V1H7.5V8H8.5V5H9.5V8H10.5V6H11.5V8H12.5V7H13.5V12H12.5V14H11.5V15H5.5V14H4.5V13H3.5V11H2.5V9Z" /></svg>;
HandPoint.displayName = 'HandPoint';

export default HandPoint;
