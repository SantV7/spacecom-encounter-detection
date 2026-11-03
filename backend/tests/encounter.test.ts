
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { detectEncounters } from "../src/features/encounters/detect.js";
import type { Position } from "../src/types/position.js";

const TIMESTAMP = "2026-11-03 12:00:00";

function createPosition(
  id: number,
  overrides: Partial<Position> = {}
): Position {
  return {
    id,
    timestamp: TIMESTAMP,
    lat: -15.7801,
    lon: -47.9292,
    factionId: null,
    protectiveMeasure: false,
    restrictionIds: [],
    ...overrides,
  };
}

describe("Detecção e classificação de encontros", () => {
  it("deve detectar um encontro genérico", () => {
    const positions = [
      createPosition(1),
      createPosition(2),
    ];

    const encounters = detectEncounters(positions);

    assert.equal(encounters.length, 1);
    assert.equal(encounters[0]?.tipo, "generico");
    assert.deepEqual(
      encounters[0]?.monitoradosEncontro,
      [1, 2]
    );
    assert.equal(encounters[0]?.distanciaMetros, 0);
  });

  it("deve detectar encontro entre membros da mesma facção", () => {
    const positions = [
      createPosition(1, { factionId: 1 }),
      createPosition(2, { factionId: 1 }),
    ];

    const encounters = detectEncounters(positions);

    assert.equal(encounters.length, 1);
    assert.equal(encounters[0]?.tipo, "faccao");
  });

  it("deve classificar facções diferentes como encontro genérico", () => {
    const positions = [
      createPosition(1, { factionId: 1 }),
      createPosition(2, { factionId: 2 }),
    ];

    const encounters = detectEncounters(positions);

    assert.equal(encounters.length, 1);
    assert.equal(encounters[0]?.tipo, "generico");
  });

  it("deve detectar violação de medida protetiva", () => {
    const positions = [
      createPosition(1, {
        protectiveMeasure: true,
        restrictionIds: [2],
      }),
      createPosition(2),
    ];

    const encounters = detectEncounters(positions);

    assert.equal(encounters.length, 1);
    assert.equal(encounters[0]?.tipo, "protetiva");
  });

  it("não deve registrar violação para agressor não relacionado", () => {
    const positions = [
      createPosition(1, {
        protectiveMeasure: true,
        restrictionIds: [3],
      }),
      createPosition(2),
    ];

    const encounters = detectEncounters(positions);

    assert.equal(encounters.length, 0);
  });

  it("não deve detectar encontros com timestamps diferentes", () => {
    const positions = [
      createPosition(1),
      createPosition(2, {
        timestamp: "2026-11-03 12:00:01",
      }),
    ];

    const encounters = detectEncounters(positions);

    assert.equal(encounters.length, 0);
  });

  it("não deve detectar encontros acima de 20 metros", () => {
    const positions = [
      createPosition(1),
      createPosition(2, {
        lat: -15.781,
        lon: -47.9292,
      }),
    ];

    const encounters = detectEncounters(positions);

    assert.equal(encounters.length, 0);
  });

  it("não deve duplicar encontros do mesmo par", () => {
    const positions = [
      createPosition(1),
      createPosition(2),
      createPosition(1),
    ];

    const encounters = detectEncounters(positions);

    assert.equal(encounters.length, 1);
  });

  it("deve retornar lista vazia quando não houver posições suficientes", () => {
    assert.deepEqual(detectEncounters([]), []);
    assert.deepEqual(
      detectEncounters([createPosition(1)]),
      []
    );
  });

  it("deve preservar as posições e o timestamp no JSON", () => {
    const positions = [
      createPosition(2),
      createPosition(1),
    ];

    const encounters = detectEncounters(positions);
    const encounter = encounters[0];

    assert.ok(encounter);
    assert.equal(encounter.timestamp, TIMESTAMP);
    assert.deepEqual(encounter.monitoradosEncontro, [1, 2]);

    assert.deepEqual(encounter.posicoes["1"], {
      lat: -15.7801,
      lon: -47.9292,
    });

    assert.deepEqual(encounter.posicoes["2"], {
      lat: -15.7801,
      lon: -47.9292,
    });
  });
});
