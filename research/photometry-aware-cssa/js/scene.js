import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EM_SYSTEM, DISPLAY } from './constants.js';
import { computeLagrangePoints } from './lagrange.js';
import { createGridLayer } from './grid-layer.js';
import { ObserverLayer } from './observer-layer.js';

const makeLabel = (text, color = '#ffffff') => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = '600 34px Inter, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = 'rgba(0, 0, 0, 0.62)';
  context.fillRect(18, 18, 220, 60);
  context.strokeStyle = 'rgba(255, 255, 255, 0.24)';
  context.strokeRect(18, 18, 220, 60);
  context.fillStyle = color;
  context.fillText(text, 128, 49);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.26, 0.098, 1);
  sprite.renderOrder = 20;
  return sprite;
};

const makeCircle = (radius, segments, material) => {
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const theta = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(radius * Math.cos(theta), radius * Math.sin(theta), 0));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.LineLoop(geometry, material);
};

const makeBody = ({ radius, color, emissive, roughness = 0.8 }) => new THREE.Mesh(
  new THREE.SphereGeometry(radius, 64, 32),
  new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0.08, roughness, metalness: 0 })
);

const addPrimary = (group, body, position, labelText, labelColor) => {
  body.position.copy(position);
  group.add(body);
  const label = makeLabel(labelText, labelColor);
  label.position.copy(position).add(new THREE.Vector3(0, 0.08, 0));
  group.add(label);
};

export class CSSAScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02050c);
    this.observerLayer = null;

    this.camera = new THREE.PerspectiveCamera(46, 1, 0.001, 40);
    this.camera.position.set(0.45, -3.7, 3.0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.target.set(0.35, 0, 0);
    this.controls.minDistance = 0.35;
    this.controls.maxDistance = 15;

    this.layers = {
      axes: new THREE.Group(),
      lagrange: new THREE.Group(),
      xgeo: new THREE.Group(),
      primaries: new THREE.Group(),
      zones: new THREE.Group(),
      grid: new THREE.Group(),
      observers: new THREE.Group()
    };

    Object.values(this.layers).forEach((group) => this.scene.add(group));
    this.#buildScene();
    this.resize();
    this.#animate();
  }

  #buildScene() {
    this.scene.add(new THREE.AmbientLight(0x8899bb, 1.6));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(-4, -3, 5);
    this.scene.add(keyLight);

    const earthPosition = new THREE.Vector3(-EM_SYSTEM.mu, 0, 0);
    const moonPosition = new THREE.Vector3(1 - EM_SYSTEM.mu, 0, 0);

    addPrimary(
      this.layers.primaries,
      makeBody({ radius: DISPLAY.earthRadius, color: 0x2b6cb0, emissive: 0x0d2a4a, roughness: 0.72 }),
      earthPosition,
      'Earth',
      '#9ed0ff'
    );

    addPrimary(
      this.layers.primaries,
      makeBody({ radius: DISPLAY.moonRadius, color: 0xb9b9b2, emissive: 0x222222, roughness: 1 }),
      moonPosition,
      'Moon',
      '#eeeeee'
    );

    const barycenter = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 24, 12),
      new THREE.MeshBasicMaterial({ color: 0xffcc66 })
    );
    this.layers.primaries.add(barycenter);
    const baryLabel = makeLabel('Barycenter', '#ffdd88');
    baryLabel.position.set(0, -0.1, 0);
    this.layers.primaries.add(baryLabel);

    const axisLength = 4.5;
    const axis = (start, end, color) => new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([start, end]),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 })
    );
    this.layers.axes.add(
      axis(new THREE.Vector3(-axisLength, 0, 0), new THREE.Vector3(axisLength, 0, 0), 0xe57373),
      axis(new THREE.Vector3(0, -axisLength, 0), new THREE.Vector3(0, axisLength, 0), 0x81c784),
      axis(new THREE.Vector3(0, 0, -axisLength), new THREE.Vector3(0, 0, axisLength), 0x64b5f6)
    );

    const xgeoMaterial = new THREE.LineBasicMaterial({ color: 0x66d9ff, transparent: true, opacity: 0.85 });
    const xgeo = makeCircle(DISPLAY.xgeoRadius, 720, xgeoMaterial);
    xgeo.position.copy(earthPosition);
    this.layers.xgeo.add(xgeo);
    const xgeoLabel = makeLabel('XGEO boundary', '#79e3ff');
    xgeoLabel.position.set(earthPosition.x, DISPLAY.xgeoRadius + 0.12, 0);
    this.layers.xgeo.add(xgeoLabel);

    const points = computeLagrangePoints(EM_SYSTEM.mu);
    Object.entries(points).forEach(([name, point]) => {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 24, 12),
        new THREE.MeshBasicMaterial({ color: 0xff77c8 })
      );
      marker.position.set(point.x, point.y, point.z);
      this.layers.lagrange.add(marker);
      const label = makeLabel(name, '#ff9bd5');
      label.position.set(point.x, point.y + (point.y >= 0 ? 0.08 : -0.08), point.z);
      this.layers.lagrange.add(label);
    });

    const referenceGrid = new THREE.GridHelper(8, 32, 0x36506f, 0x17263b);
    referenceGrid.rotation.x = Math.PI / 2;
    referenceGrid.material.transparent = true;
    referenceGrid.material.opacity = 0.2;
    this.scene.add(referenceGrid);
  }

  loadStudyData(grid, observers) {
    this.layers.grid.clear();
    this.layers.zones.clear();
    this.layers.observers.clear();

    this.layers.grid.add(createGridLayer(grid));

    const earth = new THREE.Vector3(-EM_SYSTEM.mu, 0, 0);
    const moon = new THREE.Vector3(1 - EM_SYSTEM.mu, 0, 0);
    grid.zones.filter((zone) => Number.isFinite(zone.radiusLU)).forEach((zone) => {
      const material = new THREE.LineDashedMaterial({
        color: zone.color,
        transparent: true,
        opacity: 0.9,
        dashSize: 0.035,
        gapSize: 0.02
      });
      const circle = makeCircle(zone.radiusLU, 180, material);
      circle.position.copy(zone.center === 'moon' ? moon : earth);
      circle.computeLineDistances();
      this.layers.zones.add(circle);
    });

    this.observerLayer = new ObserverLayer(observers);
    this.layers.observers.add(this.observerLayer.root);
    this.setTimeIndex(0);
  }

  setLayerVisibility(layer, visible) {
    if (layer === 'trajectories') this.observerLayer?.setTrajectoriesVisible(visible);
    else if (layer === 'markers') this.observerLayer?.setMarkersVisible(visible);
    else if (this.layers[layer]) this.layers[layer].visible = visible;
  }

  setObserverFamily(family) {
    this.observerLayer?.setFamilyFilter(family);
    return this.observerLayer?.countForFamily(family) ?? 0;
  }

  setTimeIndex(index) {
    this.observerLayer?.setTimeIndex(index);
  }

  resetView() {
    this.camera.position.set(0.45, -3.7, 3.0);
    this.controls.target.set(0.35, 0, 0);
    this.controls.update();
  }

  setPlanarView() {
    this.camera.position.set(0.35, 0, 5.6);
    this.controls.target.set(0.35, 0, 0);
    this.controls.update();
  }

  resize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  #animate() {
    requestAnimationFrame(() => this.#animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
