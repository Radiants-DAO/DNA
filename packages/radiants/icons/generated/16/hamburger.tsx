import type { IconProps } from '../../types';
export const Hamburger = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 3H14V5H2V3ZM2 7H14V9H2V7ZM2 11H14V13H2V11Z" /></svg>;
Hamburger.displayName = 'Hamburger';

export default Hamburger;
