import type { IconProps } from '../../types';
export const DesignPencil = ({ size = 24, className = '', ...props }: IconProps) => <svg width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" {...props}><g fill="currentColor"><path d="M16.499 7.498H15.501V13.503H16.499V7.498ZM9.506 3.502V2.498H8.502V3.502H7.501V17.499H8.499V9.5H13.5V17.499H14.497V7.498H15.501V6.501H14.497V3.502H13.5V2.498H12.502V3.502H9.506ZM13.503 4.499V5.503H8.502V4.499H13.503Z" /><path d="M8.499 17.499V19.501H9.503V18.503H12.502V19.501H13.5V17.499H8.499ZM12.502 19.501H11.498V20.499H12.502V19.501ZM12.502 1.5H9.503V2.498H12.502V1.5ZM11.498 20.499H10.501V22.5H11.498V20.499ZM10.5 19.501H9.503V20.499H10.5V19.501Z" /></g></svg>;
DesignPencil.displayName = 'DesignPencil';

export default DesignPencil;
