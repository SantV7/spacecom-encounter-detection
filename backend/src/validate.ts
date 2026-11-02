
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { Encounter } from "./types/encounter.js";

interface ValidationResult {
  dataset: number;
  expected: number;
  actual: number;
  correct: number;
  missing: number;
  unexpected: number;
}

const DATASETS = [
  {
    number: 1,
    expectedPath: "datasets/expected/first_answers.json",
    actualPath: "outputs/output1.json",
  },
  {
    number: 2,
    expectedPath: "datasets/expected/second_answers.json",
    actualPath: "outputs/output2.json",
  },
];

async function loadEncounters(
  path: string
): Promise<Encounter[]> {
  const content = await readFile(resolve(path), "utf8");
  const parsed: unknown = JSON.parse(content);

  if (!Array.isArray(parsed)) {
    throw new Error(`O arquivo ${path} não contém um array.`);
  }

  return parsed as Encounter[];
}

/**
 * Normaliza a ordem dos IDs para identificar o encontro
 * independentemente da posição de cada monitorado no array.
 */
function encounterKey(encounter: Encounter): string {
  const ids = [...encounter.monitoradosEncontro].sort(
    (a, b) => a - b
  );

  return `${encounter.timestamp}|${ids[0]}|${ids[1]}`;
}

/**
 * Compara os dados do encontro, incluindo a distância
 * calculada por Haversine.
 */
function encountersMatch(
  actual: Encounter,
  expected: Encounter
): boolean {
  if (actual.tipo !== expected.tipo) return false;

  if (actual.timestamp !== expected.timestamp) {
    return false;
  }

  const actualIds = [...actual.monitoradosEncontro].sort(
    (a, b) => a - b
  );

  const expectedIds = [...expected.monitoradosEncontro].sort(
    (a, b) => a - b
  );

  if (
    actualIds[0] !== expectedIds[0] ||
    actualIds[1] !== expectedIds[1]
  ) {
    return false;
  }

  for (const id of expectedIds) {
    const actualPosition = actual.posicoes[String(id)];
    const expectedPosition = expected.posicoes[String(id)];

    if (!actualPosition || !expectedPosition) {
      return false;
    }

    if (
      actualPosition.lat !== expectedPosition.lat ||
      actualPosition.lon !== expectedPosition.lon
    ) {
      return false;
    }
  }

  const DISTANCE_TOLERANCE = 1e-6;

  return (
    Number.isFinite(actual.distanciaMetros) &&
    Math.abs(
      actual.distanciaMetros - expected.distanciaMetros
    ) <= DISTANCE_TOLERANCE
  );
}

async function validateDataset(
  dataset: (typeof DATASETS)[number]
): Promise<ValidationResult> {
  const expected = await loadEncounters(
    dataset.expectedPath
  );

  const actual = await loadEncounters(
    dataset.actualPath
  );

  const expectedMap = new Map<string, Encounter>();

  for (const encounter of expected) {
    const key = encounterKey(encounter);

    if (expectedMap.has(key)) {
      throw new Error(
        `Encontro duplicado no gabarito: ${key}`
      );
    }

    expectedMap.set(key, encounter);
  }

  const actualKeys = new Set<string>();

  let correct = 0;
  let unexpected = 0;

  for (const encounter of actual) {
    const key = encounterKey(encounter);

    // Um encontro duplicado também é um falso positivo.
    if (actualKeys.has(key)) {
      unexpected++;
      continue;
    }

    actualKeys.add(key);

    const expectedEncounter = expectedMap.get(key);

    if (
      expectedEncounter &&
      encountersMatch(encounter, expectedEncounter)
    ) {
      correct++;
    } else {
      unexpected++;
    }
  }

  return {
    dataset: dataset.number,
    expected: expected.length,
    actual: actual.length,
    correct,
    missing: expected.length - correct,
    unexpected,
  };
}

async function main(): Promise<void> {
  let hasErrors = false;

  console.log("\nValidação dos datasets oficiais\n");

  for (const dataset of DATASETS) {
    const result = await validateDataset(dataset);

    const passed =
      result.missing === 0 &&
      result.unexpected === 0;

    if (!passed) hasErrors = true;

    console.log(
      `Dataset ${result.dataset}: ${passed ? "PASSOU" : "FALHOU"}`
    );

    console.log(
      `  Esperados: ${result.expected}`
    );

    console.log(
      `  Gerados: ${result.actual}`
    );

    console.log(
      `  Corretos: ${result.correct}`
    );

    console.log(
      `  Ausentes: ${result.missing}`
    );

    console.log(
      `  Incorretos: ${result.unexpected}\n`
    );
  }

  if (hasErrors) {
    process.exitCode = 1;
    return;
  }

  console.log(
    "Todos os encontros correspondem aos gabaritos."
  );
}

main().catch((error: unknown) => {
  console.error("Erro na validação:", error);
  process.exitCode = 1;
});
