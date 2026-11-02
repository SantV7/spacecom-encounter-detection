
import type { Position } from "../types/position.js";

function removeQuotes(value: string): string {
  return value.trim().replace(/^"|"$/g, "");
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

  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(timestamp)) {
    throw new Error(`Timestamp inválido: ${timestamp}`);
  }

  const factionId = faction === "" ? null : Number(faction);

  if (factionId !== null && !Number.isSafeInteger(factionId)) {
    throw new Error(`Facção inválida: ${line}`);
  }

  const restrictionIds = restrictions === ""
    ? []
    : restrictions.split(",").map((value) => Number(value.trim()));

  if (restrictionIds.some((value) => !Number.isSafeInteger(value))) {
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
