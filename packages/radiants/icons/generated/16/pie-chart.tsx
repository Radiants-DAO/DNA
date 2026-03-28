import type { IconProps } from '../../types';
export const PieChart = ({ size = 16, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" {...props}><path fill="currentColor" d="M2 6H3V5H4V4H5V3H8V5H7V9H13V11H12V12H11V13H10V14H5V13H4V12H3V11H2V6ZM8 6H9V3H10V2H11V3H12V4H13V5H14V8H8V6Z" /></svg>;
PieChart.displayName = 'PieChart';

export default PieChart;
