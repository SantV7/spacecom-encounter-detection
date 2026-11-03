import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { haversineDistance } from "../src/geolocation.js";

describe('Cálculo de distância geográfica', () => {
  it('deve retornar zero para coordenadas idênticas', () => {
    const distance = haversineDistance(
      { lat: -15.7801, lon: -47.9292 },
      { lat: -15.7801, lon: -47.9292 }
    );

    assert.equal(distance, 0);
  });

  it('deve calcular a mesma distância nos dois sentidos', () => {
    const pointA = { lat: -15.7801, lon: -47.9292 };
    const pointB = { lat: -15.7802, lon: -47.9293 };

    const distanceAB = haversineDistance(pointA, pointB);
    const distanceBA = haversineDistance(pointB, pointA);

    assert.ok(Math.abs(distanceAB - distanceBA) < 0.000001);
  });

  it('deve calcular uma distância positiva entre pontos distintos', () => {
    const distance = haversineDistance(
      { lat: -15.7801, lon: -47.9292 },
      { lat: -15.7802, lon: -47.9293 }
    );

    assert.ok(distance > 0);
  });

  it('deve identificar pontos separados por menos de 20 metros', () => {
    const distance = haversineDistance(
      { lat: -15.7801, lon: -47.9292 },
      { lat: -15.78015, lon: -47.9292 }
    );

    assert.ok(distance < 20);
  });

  it('deve identificar pontos separados por mais de 20 metros', () => {
    const distance = haversineDistance(
      { lat: -15.7801, lon: -47.9292 },
      { lat: -15.781, lon: -47.9292 }
    );

    assert.ok(distance > 20);
  });
});
