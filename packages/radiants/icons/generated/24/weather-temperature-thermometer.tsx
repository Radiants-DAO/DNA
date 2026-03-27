import type { IconProps } from '../../types';
export const WeatherTemperatureThermometer = ({ size = 24, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" {...props}><g fill="currentColor"><path d="M18.999 4.499H14.996V5.503H18.999V4.499ZM18.999 12.505H14.996V13.503H18.999V12.505ZM18.999 8.502H14.996V9.5H18.999V8.502ZM5.998 21.503H6.996V22.5H10.999V21.503H12V20.505H13.004V16.502H12V15.505H11.002V2.504H9.998V11.501H7.997V2.504H6.996V15.505H5.998V16.502H5.001V20.505H5.998V21.503ZM9.995 16.502H10.999V17.5H12V19.501H11.002V17.5H9.998L9.995 16.502ZM9.995 1.5H8V2.504H9.995V1.5Z" /></g></svg>;
WeatherTemperatureThermometer.displayName = 'WeatherTemperatureThermometer';

export default WeatherTemperatureThermometer;
