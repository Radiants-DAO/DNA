import type { IconProps } from '../../types';
export const RecordPlayer = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M3.5 4H4.5V3H10.5V2H11.5V3H12.5V9H11.5V10H4.5V9H3.5V4ZM5.5 5V8H6.5V9H9.5V8H10.5V5H9.5V4H6.5V5H5.5ZM10.5 4V5H11.5V4H10.5ZM3.5 10H4.5V11H11.5V10H12.5V12H11.5V14H4.5V12H3.5V10ZM5.5 12V13H10.5V12H5.5ZM7.5 6H8.5V7H7.5V6Z" /></svg>;
RecordPlayer.displayName = 'RecordPlayer';

export default RecordPlayer;
