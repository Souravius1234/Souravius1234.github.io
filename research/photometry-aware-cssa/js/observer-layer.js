import * as THREE from 'three';

export const FAMILY_COLORS = {
  halo: '#f472b6',
  lyapunov: '#fbbf24',
  dro: '#34d399',
  short: '#60a5fa',
  longp: '#a78bfa',
  resonant: '#fb7185'
};

export class ObserverLayer {
  constructor(dataset) {
    this.dataset = dataset;
    this.root = new THREE.Group();
    this.trajectoryRoot = new THREE.Group();
    this.markerRoot = new THREE.Group();
    this.root.add(this.trajectoryRoot, this.markerRoot);
    this.familyGroups = new Map();
    this.markerEntries = [];
    this.currentFamily = 'all';

    const markerGeometry = new THREE.SphereGeometry(0.018, 16, 10);
    dataset.families.forEach((family) => {
      const color = FAMILY_COLORS[family] || '#ffffff';
      const trajectories = new THREE.Group();
      const markers = new THREE.Group();
      trajectories.name = `${family}-trajectories`;
      markers.name = `${family}-markers`;
      this.trajectoryRoot.add(trajectories);
      this.markerRoot.add(markers);
      this.familyGroups.set(family, { trajectories, markers });

      const lineMaterial = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.58, depthWrite: false });
      const markerMaterial = new THREE.MeshBasicMaterial({ color });

      dataset.observers.filter((observer) => observer.family === family).forEach((observer) => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(observer.positions, 3));
        const line = new THREE.Line(geometry, lineMaterial);
        line.userData.observer = observer;
        trajectories.add(line);

        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.userData.observer = observer;
        markers.add(marker);
        this.markerEntries.push({ observer, marker });
      });
    });

    this.setTimeIndex(0);
  }

  setTimeIndex(index) {
    const bounded = Math.max(0, Math.min(this.dataset.samplesPerObserver - 1, index));
    const offset = bounded * 3;
    this.markerEntries.forEach(({ observer, marker }) => {
      marker.position.set(observer.positions[offset], observer.positions[offset + 1], observer.positions[offset + 2]);
    });
  }

  setFamilyFilter(family) {
    this.currentFamily = family;
    this.familyGroups.forEach((groups, name) => {
      const visible = family === 'all' || family === name;
      groups.trajectories.visible = visible;
      groups.markers.visible = visible;
    });
  }

  setTrajectoriesVisible(visible) {
    this.trajectoryRoot.visible = visible;
  }

  setMarkersVisible(visible) {
    this.markerRoot.visible = visible;
  }

  countForFamily(family) {
    return family === 'all' ? this.dataset.observers.length : this.dataset.observers.filter((observer) => observer.family === family).length;
  }
}
