const loadJSON = async (path) => {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

const decodeFloat32LE = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

  if (bytes.byteLength % 4 !== 0) throw new Error('Invalid Float32 payload length.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const values = new Float32Array(bytes.byteLength / 4);
  for (let i = 0; i < values.length; i += 1) values[i] = view.getFloat32(i * 4, true);
  return values;
};

const distance = (x, y, z, center) => Math.hypot(x - center[0], y - center[1], z - center[2]);

export const loadManifest = () => loadJSON('./data/manifest.json');

export const loadObserverDataset = async (descriptor) => {
  if (!descriptor?.index) throw new Error('Observer dataset descriptor is missing its index path.');

  const indexUrl = new URL(descriptor.index, window.location.href);
  const index = await loadJSON(indexUrl.href);
  const chunkPayloads = await Promise.all(
    index.chunks.map((chunk) => loadJSON(new URL(chunk, indexUrl).href))
  );

  const observers = [];
  chunkPayloads.forEach((chunk) => {
    if (chunk.encoding !== 'float32-le-base64') throw new Error(`Unsupported observer encoding: ${chunk.encoding}`);
    const values = decodeFloat32LE(chunk.positionsBase64);
    const stride = chunk.samplesPerObserver * chunk.componentsPerSample;
    const expected = chunk.observers.length * stride;
    if (values.length !== expected) throw new Error(`Observer chunk has ${values.length} values; expected ${expected}.`);

    chunk.observers.forEach((metadata, localIndex) => {
      const start = localIndex * stride;
      observers.push({
        ...metadata,
        positions: values.slice(start, start + stride)
      });
    });
  });

  observers.sort((a, b) => a.index - b.index);
  if (observers.length !== index.observerCount) {
    throw new Error(`Loaded ${observers.length} observers; expected ${index.observerCount}.`);
  }

  return { ...index, observers };
};

export const buildGridDataset = (manifest) => {
  const config = manifest.grid;
  if (!config) throw new Error('Manifest does not define the surveillance grid.');

  const earth = [-manifest.mu, 0, 0];
  const moon = [1 - manifest.mu, 0, 0];
  const dx = (config.xMax - config.xMin) / (config.nx - 1);
  const dy = (config.yMax - config.yMin) / (config.ny - 1);
  const positions = [];
  const zoneIds = [];

  const earthZone = config.zones.find((zone) => zone.id === 1);
  const lunarZone = config.zones.find((zone) => zone.id === 2);

  // ix is the outer loop and iy the inner loop to reproduce MATLAB X(:), Y(:)
  // ordering from meshgrid followed by column-major linearization.
  for (let ix = 0; ix < config.nx; ix += 1) {
    const x = config.xMin + ix * dx;
    for (let iy = 0; iy < config.ny; iy += 1) {
      const y = config.yMin + iy * dy;
      const z = config.z;
      const dEarth = distance(x, y, z, earth);
      const dMoon = distance(x, y, z, moon);
      const valid = dEarth >= config.earthRadiusLU + config.earthBufferLU
        && dMoon >= config.moonRadiusLU + config.moonBufferLU
        && dEarth <= config.outerRadiusLU;
      if (!valid) continue;

      let zoneId = 3;
      if (dEarth <= earthZone.radiusLU) zoneId = 1;
      if (dMoon <= lunarZone.radiusLU) zoneId = 2;
      positions.push(x, y, z);
      zoneIds.push(zoneId);
    }
  }

  if (zoneIds.length !== manifest.study.gridCells) {
    throw new Error(`Generated ${zoneIds.length} grid cells; expected ${manifest.study.gridCells}.`);
  }

  const counts = new Map(config.zones.map((zone) => [zone.id, 0]));
  zoneIds.forEach((zoneId) => counts.set(zoneId, counts.get(zoneId) + 1));
  const activePriority = config.zones.reduce((sum, zone) => sum + (counts.get(zone.id) > 0 ? zone.priorityWeight : 0), 0);
  const weights = new Float32Array(zoneIds.length);
  zoneIds.forEach((zoneId, index) => {
    const zone = config.zones.find((candidate) => candidate.id === zoneId);
    weights[index] = (zone.priorityWeight / activePriority) / counts.get(zoneId);
  });

  return {
    positions: new Float32Array(positions),
    zoneIds: new Uint8Array(zoneIds),
    weights,
    cellCount: zoneIds.length,
    zoneCounts: Object.fromEntries(config.zones.map((zone) => [zone.name, counts.get(zone.id)])),
    zones: config.zones,
    config
  };
};

export const datasetAvailability = (manifest) => ({
  observers: manifest.datasets?.observerTrajectories?.status === 'available',
  grid: manifest.datasets?.grid?.status === 'available',
  coverage: manifest.datasets?.coverage?.status === 'available',
  constellations: manifest.datasets?.constellations?.status === 'available'
});
