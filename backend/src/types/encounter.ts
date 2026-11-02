
export type EncounterType =
  | "generico"
  | "faccao"
  | "protetiva";

export interface Encounter {
  tipo: EncounterType;

  monitoradosEncontro: [number, number];

  timestamp: string;

  posicoes: Record<
    string,
    {
      lat: number;
      lon: number;
    }>;

  distanciaMetros: number;
};
