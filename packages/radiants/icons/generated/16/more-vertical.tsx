import type { IconProps } from '../../types';
export const MoreVertical = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><g fill="currentColor"><path d="M7 13H9V15H7z" transform="rotate(-90 7 13)" /><path d="M7 9H9V11H7z" transform="rotate(-90 7 9)" /><path d="M7 5H9V7H7z" transform="rotate(-90 7 5)" /></g></svg>;
MoreVertical.displayName = 'MoreVertical';

export default MoreVertical;
