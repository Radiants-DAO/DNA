import type { IconProps } from '../../types';
export const SocialRewardsFlag = ({ size = 24, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" {...props}><g fill="currentColor"><path d="M21.499 9.5H20.502V18.497H21.499V9.5ZM3.498 22.5H4.502V17.499H9.503V18.497H10.5V19.501H20.502V18.497H12.502V17.499H13.499V9.5H20.502V8.496H12.502V7.498H11.498V16.495H4.502V7.498H11.498V6.501H4.502V5.497H5.5V4.499H3.498V22.5Z" /><path d="M6.504 2.498H5.5V4.499H6.504V2.498ZM5.5 1.5H3.498V2.498H5.5V1.5ZM3.498 2.498H2.5V4.499H3.498V2.498Z" /></g></svg>;
SocialRewardsFlag.displayName = 'SocialRewardsFlag';

export default SocialRewardsFlag;
