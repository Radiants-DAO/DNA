import type { IconProps } from '../../types';
export const Document = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M3 2H9V6H13V14H3V2ZM5 5V6H8V5H5ZM5 7V8H11V7H5ZM5 9V10H11V9H5ZM5 11V12H11V11H5ZM10 2H11V3H12V4H13V5H10V2Z" /></svg>;
Document.displayName = 'Document';

export default Document;
