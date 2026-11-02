
import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";

import type { Position } from "./types/position.js";
import type { Encounter } from "./types/encounter.js";

import { parseLine } from "./utils/parser.js";
import { detectEncounters } from "./features/encounters/detect.js";

const EXPECTED_HEADER = [
  "idMonitorado",
  "faccaoMonitorado",
  "timestamp",
  "latitude",
  "longitude",
  "medidaProtetiva",
  "idsRestricaoMedida",
].join(";");

async function processDataset(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const start = performance.now();

  const stream = createReadStream(inputPath, {
    encoding: "utf8",
  });

  const reader = createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  const encounters: Encounter[] = [];
  let currentTimestamp: string | null = null;
  let currentPositions: Position[] = [];
  let totalRecords = 0;
  let headerValidated = false;

  function processGroup(): void {
    if (currentPositions.length < 2) {
      return;
    }

    const detected = detectEncounters(currentPositions);
    encounters.push(...detected);
  }

  try {
    for await (const rawLine of reader) {
      const line = rawLine.trim();

      if (!line) {
        continue;
      }

      if (!headerValidated) {
        const header = line.replace(/^\uFEFF/, "");

        if (header !== EXPECTED_HEADER) {
          throw new Error("Cabeçalho do dataset inválido.");
        }

        headerValidated = true;
        continue;
      }

      const position = parseLine(line);
      totalRecords++;

      if (currentTimestamp === null) {
        currentTimestamp = position.timestamp;
      }

      if (position.timestamp < currentTimestamp) {
        throw new Error(
          "Dataset fora de ordem cronológica. " +
          "É necessário agrupar os registros por timestamp."
        );
      }

      if (position.timestamp !== currentTimestamp) {
        processGroup();

        currentPositions = [];
        currentTimestamp = position.timestamp;
      }

      currentPositions.push(position);
    }

    if (!headerValidated) {
      throw new Error("Dataset vazio ou sem cabeçalho.");
    }

    processGroup();

    await mkdir(dirname(outputPath), {
      recursive: true,
    });

    await writeFile(
      outputPath,
      JSON.stringify(encounters, null, 2),
      "utf8"
    );

    const duration = performance.now() - start;

    console.log("Processamento concluído.");
    console.log(`Registros analisados: ${totalRecords}`);
    console.log(`Encontros detectados: ${encounters.length}`);
    console.log(`Arquivo gerado: ${outputPath}`);
    console.log(`Tempo: ${(duration / 1000).toFixed(3)}s`);
  } finally {
    reader.close();
    stream.destroy();
  }
}

async function main(): Promise<void> {
  const input = process.argv[2];
  const output = process.argv[3];

  if (!input || !output) {
    console.error(
      "Uso: npm run dev -- <dataset.txt> <output.json>"
    );
    process.exitCode = 1;
    return;
  }

  try {
    await processDataset(resolve(input), resolve(output));
  } catch (error) {
    console.error("Erro no processamento:", error);
    process.exitCode = 1;
  }
}

await main();
