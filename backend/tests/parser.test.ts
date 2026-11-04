import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { parseLine, parseDataset } from "../src/utils/parser.js";

const HEADER = "idMonitorado;faccaoMonitorado;timestamp;latitude;longitude;medidaProtetiva;idsRestricaoMedida";

function createLine(overrides: Partial<Record<string, string>> = {}): string {
  const fields = {
    id: "1",
    faction: "",
    timestamp: '"2024-02-29 23:59:59"',
    lat: "-15.7801",
    lon: "-47.9292",
    protective: "false",
    restrictions: "",
    ...overrides,
  };

  return [
    fields.id,
    fields.faction,
    fields.timestamp,
    fields.lat,
    fields.lon,
    fields.protective,
    fields.restrictions,
  ].join(";");
}

describe("Interpretação dos registros do dataset", () => {
  it("interpreta um registro válido com facção e restrições opcionais vazias", () => {
    assert.deepEqual(parseLine(createLine()), {
      id: 1,
      factionId: null,
      timestamp: "2024-02-29 23:59:59",
      lat: -15.7801,
      lon: -47.9292,
      protectiveMeasure: false,
      restrictionIds: [],
    });
  });

  it("interpreta facção e múltiplos IDs de restrição", () => {
    const position = parseLine(createLine({
      faction: "7",
      protective: "true",
      restrictions: '"2, 3"',
    }));

    assert.equal(position.factionId, 7);
    assert.equal(position.protectiveMeasure, true);
    assert.deepEqual(position.restrictionIds, [2, 3]);
  });

  it("rejeita registros com quantidade incorreta de campos", () => {
    assert.throws(() => parseLine("1;2;2024-01-01 00:00:00;0;0;false"));
  });

  it("rejeita identificadores vazios ou não inteiros", () => {
    assert.throws(() => parseLine(createLine({ id: "" })));
    assert.throws(() => parseLine(createLine({ id: "1.5" })));
  });

  it("rejeita coordenadas não finitas ou fora dos limites geográficos", () => {
    assert.throws(() => parseLine(createLine({ lat: "Infinity" })));
    assert.throws(() => parseLine(createLine({ lat: "90.0001" })));
    assert.throws(() => parseLine(createLine({ lon: "-180.0001" })));
  });

  it("rejeita valores booleanos e facções inválidos", () => {
    assert.throws(() => parseLine(createLine({ protective: "yes" })));
    assert.throws(() => parseLine(createLine({ faction: "grupo" })));
  });

  it("rejeita campos vazios dentro da lista de restrições", () => {
    assert.throws(() => parseLine(createLine({
      protective: "true",
      restrictions: '"2,,3"',
    })));
  });

  it("rejeita datas e horários impossíveis", () => {
    assert.throws(() => parseLine(createLine({ timestamp: '"2023-02-29 12:00:00"' })));
    assert.throws(() => parseLine(createLine({ timestamp: '"2024-13-01 12:00:00"' })));
    assert.throws(() => parseLine(createLine({ timestamp: '"2024-01-01 24:00:00"' })));
  });

  it("aceita cabeçalho com BOM e preserva o registro parseado", () => {
    const dataset = parseDataset(`\uFEFF${HEADER}\n${createLine()}\n`);

    assert.equal(dataset.length, 1);
    assert.equal(dataset[0]?.timestamp, "2024-02-29 23:59:59");
  });

  it("rejeita cabeçalho incompatível", () => {
    assert.throws(() => parseDataset(`id;timestamp\n${createLine()}`));
  });
});
