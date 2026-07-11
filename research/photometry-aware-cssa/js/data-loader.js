const loadJSON = async (path) => {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
  return response.json();
};

const loadText = async (path) => {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
  return response.text();
};

const base64ToBytes = (base64) => {
  const binary = atob(base64.replace(/\s+/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const gunzip = async (bytes) => {
  if (!('DecompressionStream' in window)) {
    throw new Error('This browser does not support DecompressionStream required for compressed trajectory data.');
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const decodeInt16LE = (bytes) => {
  if (bytes.byteLength % 2 !== 0) throw new Error('Invalid Int16 trajectory payload length.');
  const values = new Int16Array(bytes.byteLength / 2);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i < values.length; i += 1) values[i] = view.getInt16(i * 2, true);
  return values;
};

const decodePackedPositions = async (payload, base64) => {
  let bytes = base64ToBytes(base64);
  const isGzip = bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
  if (isGzip) bytes = await gunzip(bytes);

  const supported = new Set([
    'gzip-int16-delta-component-major-base64',
    'int16-delta-component-major-base64'
  ]);
  if (!supported.has(payload.encoding)) {
    throw new Error(`Unsupported observer encoding: ${payload.encoding}`);
  }

  const deltas = decodeInt16LE(bytes);
  const samples = payload.samplesPerObserver;
  const components = payload.componentsPerSample;
  const expected = payload.observerCount * samples * components;
  if (deltas.length !== expected) {
    throw new Error(`Trajectory payload has ${deltas.length} values; expected ${expected}.`);
  }

  const values = new Float32Array(expected);
  let cursor = 0;
  for (let observer = 0; observer < payload.observerCount; observer += 1) {
    const observerOffset = observer * samples * components;
    for (let component = 0; component < components; component += 1) {
      let accumulated = 0;
      for (let sample = 0; sample < samples; sample += 1) {
        accumulated += deltas[cursor];
        cursor += 1;
        values[observerOffset + sample * components + component] = accumulated * payload.positionScaleLU;
      }
    }
  }
  return values;
};

const distance = (x, y, z, center) => Math.hypot(x - center[0], y - center[1], z - center[2]);

export const loadManifest = () => loadJSON('./data/manifest.json');

export const loadObserverDataset = async (descriptor) => {
  if (!descriptor?.metadata) throw new Error('Observer dataset descriptor is missing its metadata path.');
  const metadataUrl = new URL(descriptor.metadata, window.location.href);
  const payload = await loadJSON(metadataUrl.href);
  if (!Array.isArray(payload.positionParts) || payload.positionParts.length === 0) {
    throw new Error('Observer metadata does not list any trajectory payload parts.');
  }

  const encodedParts = await Promise.all(
    payload.positionParts.map((part) => loadText(new URL(part, metadataUrl).href))
  );
  const values = await decodePackedPositions(payload, encodedParts.join(''));
  const stride = payload.samplesPerObserver * payload.componentsPerSample;
  const observers = payload.observers.map((metadata, index) => ({
    ...metadata,
    positions: values.slice(index * stride, (index + 1) * stride)
  }));
  observers.sort((a, b) => a.index - b.index);

  if (observers.length !== payload.observerCount) {
    throw new Error(`Loaded ${observers.length} observers; expected ${payload.observerCount}.`);
  }
  return { ...payload, observers };
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
  const activePriority = config.zones.reduce(
    (sum, zone) => sum + (counts.get(zone.id) > 0 ? zone.priorityWeight : 0),
    0
  );
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
