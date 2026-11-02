export interface Position {
  id: number;
  factionId: number | null;
  timestamp: string;
  lat: number;
  lon: number;
  protectiveMeasure: boolean;
  restrictionIds: number[];
};