export interface Place {
  id: string;
  name: string;
  type: string;
  loc: string;
  role: string;
  ig: string;
  cams: number;
  camsOn: number;
  assets: number;
  devices: number;
  devOn: number;
}

export interface ConnectedPlace {
  id: string;
  name: string;
  loc: string;
  role: string;
  property: string;
  status: 'active' | 'pending';
  ig: string;
}

export interface CommunityEstate {
  id: string;
  name: string;
  loc: string;
}

export type CommunityRole = [
  roleName: string,
  iconName: string,
  description: string
];
