import * as THREE from 'three';

export const createGridLayer = (grid) => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(grid.positions, 3));

  const zoneColors = new Map(grid.zones.map((zone) => [zone.id, new THREE.Color(zone.color)]));
  const colors = new Float32Array(grid.cellCount * 3);
  grid.zoneIds.forEach((zoneId, index) => {
    const color = zoneColors.get(zoneId);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] =