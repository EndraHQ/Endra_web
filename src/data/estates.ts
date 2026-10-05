import { CommunityEstate, CommunityRole } from '../types';

export const CPOOL: CommunityEstate[] = [
  { id: 'sunrise', name: 'Sunrise Estate', loc: 'Ajah, Lagos' },
  { id: 'palm', name: 'Palm Springs Court', loc: 'Lekki Phase 2' },
  { id: 'victoria', name: 'Victoria Court', loc: 'Victoria Island' },
  { id: 'harmony', name: 'Harmony Gardens', loc: 'Ikeja GRA' },
  { id: 'crystal', name: 'Crystal Heights', loc: 'Ikoyi' },
  { id: 'faith', name: 'Faith Chapel Campus', loc: 'Surulere' },
];

export const CROLES: CommunityRole[] = [
  ['Property Owner', 'home', 'I own a property here'],
  ['Tenant', 'key', 'I rent a property here'],
  ['Property Manager', 'folder', 'I manage properties here'],
  ['Developer', 'building', 'I develop / build here'],
  ['Worker', 'tool', 'I work for a resident'],
  ['Visitor', 'walk', 'I am visiting'],
];
