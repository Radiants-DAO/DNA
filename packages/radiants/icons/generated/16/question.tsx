import type { IconProps } from '../../types';
export const Question = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M3.5 4H4.5V3H5.5V2H10.5V3H11.5V4H12.5V7H11.5V8H9.5V9H8.5V10H6.5V8H7.5V7H9.5V6H10.5V5H9.5V4H6.5V5H5.5V6H3.5V4ZM6.5 12H8.5V14H6.5V12Z" /></svg>;
Question.displayName = 'Question';

export default Question;
