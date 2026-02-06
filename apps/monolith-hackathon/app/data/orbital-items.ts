import type { OrbitalItem } from '../components/OrbitalNav';

export const ORBITAL_ITEMS: OrbitalItem[] = [
  { id: 'hackathon', icon: '/icons/clock.svg',    label: 'Hackathon', phaseOffset: 0,              glowColor: '#ef5c6f', iconScale: 1.3 },
  { id: 'calendar', icon: '/icons/calendar.svg', label: 'Calendar', phaseOffset: Math.PI * 0.25, glowColor: '#fd8f3a' },
  { id: 'rules',    icon: '/icons/rules.svg',    label: 'Rules',    phaseOffset: Math.PI * 0.5,  glowColor: '#ef5c6f' },
  { id: 'prizes',   icon: '/icons/prizes.svg',   label: 'Prizes',   phaseOffset: Math.PI * 0.75, glowColor: '#fd8f3a' },
  { id: 'judges',   icon: '/icons/judges.svg',   label: 'Judges',   phaseOffset: Math.PI,        glowColor: '#ef5c6f' },
  { id: 'toolbox',  icon: '/icons/tools.svg',    label: 'Toolbox',  phaseOffset: Math.PI * 1.25, glowColor: '#6939ca', iconScale: 1.3 },
  { id: 'faq',      icon: '/icons/faq.svg',      label: 'FAQ',      phaseOffset: Math.PI * 1.5,  glowColor: '#6939ca' },
  { id: 'legal',    icon: '/icons/docs.svg',     label: 'Legal',    phaseOffset: Math.PI * 1.75, glowColor: '#fd8f3a' },
];
