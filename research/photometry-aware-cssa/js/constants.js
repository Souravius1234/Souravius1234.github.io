export const EM_SYSTEM = Object.freeze({
  mu: 0.0121505856,
  distanceKm: 384400,
  earthRadiusKm: 6378.1363,
  moonRadiusKm: 1737.4,
  timeUnitSeconds: 375200,
  xgeoRadiusKm: 1500000
});

export const DISPLAY = Object.freeze({
  earthRadius: EM_SYSTEM.earthRadiusKm / EM_SYSTEM.distanceKm,
  moonRadius: EM_SYSTEM.moonRadiusKm / EM_SYSTEM.distanceKm,
  xgeoRadius: EM_SYSTEM.xgeoRadiusKm / EM_SYSTEM.distanceKm
});
