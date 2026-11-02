
import type { Position } from "../../types/position.js";
import type {
  Encounter,
  EncounterType,
} from "../../types/encounter.js";

import { haversineDistance } from "../../geolocation.js";

const EARTH_RADIUS = 6_371_000;
const MAX_DISTANCE = 20;
const CELL_SIZE = 20;

type Coordinates = [number, number, number];

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toCartesian(position: Position): Coordinates {
  const latitude = toRadians(position.lat);
  const longitude = toRadians(position.lon);

  return [
    EARTH_RADIUS * Math.cos(latitude) * Math.cos(longitude),
    EARTH_RADIUS * Math.cos(latitude) * Math.sin(longitude),
    EARTH_RADIUS * Math.sin(latitude),
  ];
}

function cellCoordinates(
  coordinates: Coordinates
): Coordinates {
  return [
    Math.floor(coordinates[0] / CELL_SIZE),
    Math.floor(coordinates[1] / CELL_SIZE),
    Math.floor(coordinates[2] / CELL_SIZE),
  ];
}

function cellKey(x: number, y: number, z: number): string {
  return `${x}:${y}:${z}`;
}

function classifyEncounter(
  first: Position,
  second: Position
): EncounterType | null {
  const firstIsVictim = first.protectiveMeasure;
  const secondIsVictim = second.protectiveMeasure;

  // Verifica o vínculo entre vítima e agressor.
  if (firstIsVictim !== secondIsVictim) {
    const victim = firstIsVictim ? first : second;
    const aggressor = firstIsVictim ? second : first;

    if (victim.restrictionIds.includes(aggressor.id)) {
      return "protetiva";
    }

    return null;
  }

  if (firstIsVictim && secondIsVictim) {
    return null;
  }

  if (
    first.factionId !== null &&
    second.factionId !== null &&
    first.factionId === second.factionId
  ) {
    return "faccao";
  }

  return "generico";
}

function createEncounter(
  first: Position,
  second: Position,
  type: EncounterType,
  distance: number
): Encounter {
  const [a, b] =
    first.id <= second.id
      ? [first, second]
      : [second, first];

  return {
    tipo: type,
    monitoradosEncontro: [a.id, b.id],
    timestamp: a.timestamp,
    posicoes: {
      [a.id]: { lat: a.lat, lon: a.lon },
      [b.id]: { lat: b.lat, lon: b.lon },
    },
    distanciaMetros: distance,
  };
}

export function detectEncounters(
  positions: readonly Position[]
): Encounter[] {
  if (positions.length < 2) {
    return [];
  }

  const spatialIndex = new Map<string, Position[]>();
  const encounters: Encounter[] = [];
  const registeredPairs = new Set<string>();

  for (const current of positions) {
    const coordinates = cellCoordinates(
      toCartesian(current)
    );

    const [x, y, z] = coordinates;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = cellKey(
            x + dx,
            y + dy,
            z + dz
          );

          const candidates = spatialIndex.get(key);

          if (!candidates) continue;

          for (const candidate of candidates) {
            if (candidate.id === current.id) {
              continue;
            }

            if (candidate.timestamp !== current.timestamp) {
              continue;
            }

            const type = classifyEncounter(
              candidate,
              current
            );

            if (type === null) continue;

            const distance = haversineDistance(
              candidate,
              current
            );

            if (distance >= MAX_DISTANCE) {
              continue;
            }

            const firstId = Math.min(
              candidate.id,
              current.id
            );

            const secondId = Math.max(
              candidate.id,
              current.id
            );

            const pairKey =
              `${current.timestamp}:${firstId}:${secondId}`;

            if (registeredPairs.has(pairKey)) {
              continue;
            }

            registeredPairs.add(pairKey);

            encounters.push(
              createEncounter(
                candidate,
                current,
                type,
                distance
              )
            );
          }
        }
      }
    }

    const currentKey = cellKey(x, y, z);
    const bucket = spatialIndex.get(currentKey);

    if (bucket) {
      bucket.push(current);
    } else {
      spatialIndex.set(currentKey, [current]);
    }
  }

  return encounters;
}
