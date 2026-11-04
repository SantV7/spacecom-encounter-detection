
import type { Position } from "../types/position.js";

function removeQuotes(value: string): string {
  return value.trim().replace(/^"|"$/g, "");
}

function isValidTimestamp(value: string): boolean {
  const parts =
    /^(\d{4})-(\d{2})-(\d{2}) ([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.exec(value);

  if (!parts) {
    return false;
  }

  const year = Number(parts[1]);
  const month = Number(parts[2]);
  const day = Number(parts[3]);

  if (year < 1 || month < 1 || month > 12) {
    return false;
  }

  const isLeapYear =
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day >= 1 && day <= (daysInMonth[month - 1] ?? 0);
}

export function parseLine(line: string): Position {
  const fields = line.split(";");

  if (fields.length !== 7) {
    throw new Error(`Registro inválido: esperado 7 campos, recebido ${fields.length}`);
  }

  const [
    idRaw,
    factionRaw,
    timestampRaw,
    latRaw,
    lonRaw,
    protectiveRaw,
    restrictionsRaw,
  ] = fields;

  const id = Number(idRaw);
  const faction = removeQuotes(factionRaw ?? "");
  const timestamp = removeQuotes(timestampRaw ?? "");
  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  const protective = removeQuotes(protectiveRaw ?? "").toLowerCase();
  const restrictions = removeQuotes(restrictionsRaw ?? "");

  if (
    !idRaw?.trim() ||
    !latRaw?.trim() ||
    !lonRaw?.trim() ||
    !Number.isSafeInteger(id) ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    throw new Error(`Dados numéricos inválidos: ${line}`);
  }

  if (protective !== "true" && protective !== "false") {
    throw new Error(`Medida protetiva inválida: ${line}`);
  }

  if (!isValidTimestamp(timestamp)) {
    throw new Error(`Timestamp inválido: ${timestamp}`);
  }

  const factionId = faction === "" ? null : Number(faction);

  if (factionId !== null && !Number.isSafeInteger(factionId)) {
    throw new Error(`Facção inválida: ${line}`);
  }

  const restrictionValues =
    restrictions === ""
      ? []
      : restrictions.split(",").map((value) => value.trim());
  const restrictionIds = restrictionValues.map(Number);

  if (
    restrictionValues.some((value) => value === "") ||
    restrictionIds.some((value) => !Number.isSafeInteger(value))
  ) {
    throw new Error(`Lista de restrições inválida: ${line}`);
  }

  return {
    id,
    factionId,
    timestamp,
    lat,
    lon,
    protectiveMeasure: protective === "true",
    restrictionIds,
  };
}

export function parseDataset(content: string): Position[] {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  const header = lines.shift();

  if (
    header?.trim() !==
    "idMonitorado;faccaoMonitorado;timestamp;latitude;longitude;medidaProtetiva;idsRestricaoMedida"
  ) {
    throw new Error("Cabeçalho do dataset inválido.");
  }

  return lines.map(parseLine);
}
