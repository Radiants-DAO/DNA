import type { IconProps } from '../../types';
export const Cut = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 7H3V9H2V7ZM3 6H5V7H3V6ZM3 9H5V10H3V9ZM5 7H8V8H9V11H7V10H8V9H7V8H6V9H5V7ZM6 11H7V13H6V11ZM7 13H9V14H7V13ZM8 3H9V2H10V5H9V6H8V3ZM9 6H14V7H13V8H9V6ZM9 11H10V13H9V11Z" /></svg>;
Cut.displayName = 'Cut';

export default Cut;
