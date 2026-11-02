
import type { Position } from "./types/position.js";

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineDistance(
  origin: Pick<Position, "lat" | "lon">,
  destination: Pick<Position, "lat" | "lon">
): number {
  const latitudeDifference = toRadians(
    destination.lat - origin.lat
  );

  const longitudeDifference = toRadians(
    destination.lon - origin.lon
  );

  const originLatitude = toRadians(origin.lat);
  const destinationLatitude = toRadians(destination.lat);

  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const centralAngle =
    2 * Math.asin(Math.sqrt(Math.min(1, haversine)));

  return EARTH_RADIUS_METERS * centralAngle;
}

export function isWithinEncounterDistance(
  origin: Pick<Position, "lat" | "lon">,
  destination: Pick<Position, "lat" | "lon">
): boolean {
  return haversineDistance(origin, destination) < 20;
}
