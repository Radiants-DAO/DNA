import type { MenuItem } from './MobileNav';

/**
 * Shared navigation menu items - Single source of truth for all pages
 */
export const menuItems: MenuItem[] = [
  {
    title: 'Our Validators',
    subtitle: 'about us',
    href: '/#validators',
    buttonText: 'learn more',
    iconName: 'block-interface-essential-basic-ui-user-3',
  },
  {
    title: 'Services',
    subtitle: 'SWQoS, RPCS',
    href: '/#services',
    buttonText: 'explore',
    iconName: 'search',
  },
  {
    title: 'Our Tooling',
    subtitle: 'Open-Source Public Goods',
    href: '/#dashboards',
    buttonText: 'Learn more',
    iconName: 'block-interface-essential-other-ui-wrench',
  },
  {
    title: 'Staking',
    subtitle: 'Secure the 33% threshold',
    href: '/staking',
    buttonText: 'Stake Now',
    iconName: 'staking',
  },
];
