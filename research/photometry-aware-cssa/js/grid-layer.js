import * as THREE from 'three';

export const createGridLayer = (grid) => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(grid.positions, 3));

  const zoneColors = new Map(grid.zones.map((zone) => [zone.id, new THREE.Color(zone.color)]));
  const colors = new Float32Array(grid.cellCount * 3);
  grid.zoneIds.forEach((zoneId, index) => {
    const color = zoneColors.get(zoneId) || new THREE.Color('#ffffff');
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  });
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();

  const material = new THREE.PointsMaterial({
    size: 0.018,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    depthWrite: false
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'surveillance-grid';
  points.renderOrder = 2;
  return points;
};
