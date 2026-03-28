import type { IconProps } from '../../types';
export const Calendar = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 2H14V14H2V2ZM3 3V4H13V3H3ZM3 5V7H6V5H3ZM3 8V10H6V8H3ZM3 11V13H6V11H3ZM7 5V7H9V5H7ZM7 8V10H9V8H7ZM7 11V13H9V11H7ZM10 5V7H13V5H10ZM10 8V10H13V8H10ZM10 11V13H13V11H10Z" /></svg>;
Calendar.displayName = 'Calendar';

export default Calendar;
