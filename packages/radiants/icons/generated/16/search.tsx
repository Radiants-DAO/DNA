import type { IconProps } from '../../types';
export const Search = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 4H3V8H2V4ZM3 3H4V4H3V3ZM3 8H4V9H3V8ZM4 2H8V3H4V2ZM4 5H5V4H7V5H8V7H7V8H5V7H4V5ZM5 7H6V6H5V7ZM4 9H8V10H4V9ZM8 3H9V4H8V3ZM8 8H9V9H8V8ZM9 4H10V8H9V4ZM9 10H10V9H11V10H12V11H13V12H14V14H12V13H11V12H10V11H9V10Z" /></svg>;
Search.displayName = 'Search';

export default Search;
