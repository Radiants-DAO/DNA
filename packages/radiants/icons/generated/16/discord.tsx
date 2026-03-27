import type { IconProps } from '../../types';
export const Discord = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M13.333 6V3.33333H11.9997V2H9.33301V3.33333H10.6663V4.66667H5.33301V3.33333H6.66634V2H3.99967V3.33333H2.66634V6H1.33301V12.6667H2.66634V14H6.66634V12.6667H9.33301V14H13.333V12.6667H14.6663V6H13.333ZM5.33301 10V7.33333H6.66634V10H5.33301ZM10.6663 10H9.33301V7.33333H10.6663V10Z" /></svg>;
Discord.displayName = 'Discord';

export default Discord;
