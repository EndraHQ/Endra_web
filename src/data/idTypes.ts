export interface IdTypeOption {
  k: string;
  ico: string;
  t: string;
  s: string;
}

export const ID_TYPES: IdTypeOption[] = [
  { k: 'NIN', ico: '🆔', t: 'National ID (NIN)', s: 'NIMC National Identity Card or slip' },
  { k: "Driver's Licence", ico: '🚗', t: "Driver's Licence", s: 'FRSC-issued licence' },
  { k: 'Voter Card', ico: '🗳️', t: "Voter's Card", s: 'INEC Permanent Voter Card' },
  { k: 'Passport', ico: '📘', t: 'International Passport', s: 'Nigerian passport data page' }
];
