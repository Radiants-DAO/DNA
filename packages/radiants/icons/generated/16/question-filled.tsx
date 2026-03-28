import type { IconProps } from '../../types';
export const QuestionFilled = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 3H3V2H13V3H14V13H13V14H3V13H2V3ZM5 4V6H7V5H9V7H8V8H7V10H9V9H10V8H11V4H10V3H6V4H5ZM7 11V13H9V11H7Z" /></svg>;
QuestionFilled.displayName = 'QuestionFilled';

export default QuestionFilled;
