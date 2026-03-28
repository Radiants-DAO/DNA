import type { IconProps } from '../../types';
export const PictureInPicture = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 3.5H14V7.5H13V4.5H3V11.5H7V12.5H2V3.5ZM8 8.5H14V12.5H8V8.5ZM9 9.5V11.5H13V9.5H9Z" /></svg>;
PictureInPicture.displayName = 'PictureInPicture';

export default PictureInPicture;
