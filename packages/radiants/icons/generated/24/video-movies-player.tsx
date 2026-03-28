import type { IconProps } from '../../types';
export const VideoMoviesPlayer = ({ size = 24, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" {...props}><g fill="currentColor"><path d="M22.001 5.996H20.997V17.998H22.001V5.996ZM20.997 17.999H20V18.996H20.997V17.999ZM20.997 4.998H20V5.996H20.997V4.998Z" /><path d="M20 18.996H4.001V20H20V18.996ZM15 9.999H14.002V9.001H12.998V7.997H12V7H9.001V17.001H12V15.997H12.998V14.999H14.002V13.995H15V12.998H15.997V10.996H15V9.999ZM20 4H4.001V4.998H20V4ZM4 17.999H2.996V18.996H4V17.999ZM4 4.998H2.996V5.996H4V4.998ZM2.996 5.996H1.999V17.998H2.996V5.996Z" /></g></svg>;
VideoMoviesPlayer.displayName = 'VideoMoviesPlayer';

export default VideoMoviesPlayer;
