import type { IconProps } from '../../types';
export const ZipFile = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M3 2H10V3H9V6H12V5H13V14H3V2ZM4 3V13H7V12H8V11H7V10H8V9H7V8H8V7H7V6H8V3H4ZM8 8V9H9V10H8V11H9V12H8V13H12V7H9V8H8ZM10 3H11V4H10V3ZM11 4H12V5H11V4Z" /></svg>;
ZipFile.displayName = 'ZipFile';

export default ZipFile;
