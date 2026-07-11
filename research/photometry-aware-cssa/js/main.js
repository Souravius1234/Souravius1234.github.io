import { CSSAScene } from './scene.js';
import { loadManifest, loadObserverDataset, buildGridDataset, datasetAvailability } from './data-loader.js';
import { FAMILY_COLORS } from './observer-layer.js';

const canvas = document.querySelector('#scene-canvas');
const scene = new CSSAScene(canvas);
const formatInteger = (value) => new Intl.NumberFormat('en-US').format(value);

const setText = (selector, value) => {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
};

const bindLayerToggle = (id, layer) => {
  const input = document.querySelector(id);
  input?.addEventListener('change', () => scene.setLayerVisibility(layer, input.checked));
};

['axes', 'lagrange', 'xgeo', 'zones', 'grid', 'trajectories', 'markers'].forEach((layer) => {
  bindLayerToggle(`#toggle-${layer}`, layer);
});

window.addEventListener('resize', () => scene.resize());
document.querySelector('#reset-view')?.addEventListener('click', () => scene.resetView());
document.querySelector('#planar-view')?.addEventListener('click', () => scene.setPlanarView());

const slider = document.querySelector('#time-slider');
const playButton = document.querySelector('#play-toggle');
const familySelect = document.querySelector('#family-filter');
let timer = null;
let observerData = null;

const updateTime = (index) => {
  if (!observerData) return;
  const bounded = Math.max(0, Math.min(observerData.samplesPerObserver - 1, Number(index)));
  slider.value = String(bounded);
  scene.setTimeIndex(bounded);
  setText('#timeline-label', `Sample ${bounded + 1}/${observerData.samplesPerObserver} · ${observerData.timeDays[bounded].toFixed(2)} d`);
};

const stopPlayback = () => {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  if (playButton) playButton.textContent = 'Play';
};

const startPlayback = () => {
  stopPlayback();
  if (playButton) playButton.textContent = 'Pause';
  timer = window.setInterval(() => {
    const next = (Number(slider.value) + 1) % observerData.samplesPerObserver;
    updateTime(next);
  }, 180);
};

playButton?.addEventListener('click', () => {
  if (!observerData) return;
  if (timer === null) startPlayback();
  else stopPlayback();
});
slider?.addEventListener('input', () => updateTime(slider.value));

const addFamilyOptions = (families) => {
  families.forEach((family) => {
    const option = document.createElement('option');
    option.value = family;
    option.textContent = family === 'longp' ? 'Long-period' : family.toUpperCase();
    familySelect.append(option);
  });
};

const renderFamilyLegend = (families) => {
  const container = document.querySelector('#family-legend');
  families.forEach((family) => {
    const row = document.createElement('span');
    row.className = 'legend-item';
    row.innerHTML = `<i style="--legend-color:${FAMILY_COLORS[family] || '#fff'}"></i>${family === 'longp' ? 'long-period' : family}`;
    container.append(row);
  });
};

familySelect?.addEventListener('change', () => {
  const count = scene.setObserverFamily(familySelect.value);
  setText('#family-count', `${count} observer slots shown`);
});

const initialize = async () => {
  const status = document.querySelector('#data-status');
  try {
    const manifest = await loadManifest();
    const availability = datasetAvailability(manifest);
    setText('#metric-observers', formatInteger(manifest.study.candidateObservers));
    setText('#metric-cells', formatInteger(manifest.study.gridCells));
    setText('#metric-times', formatInteger(manifest.study.timeSamples));
    setText('#metric-entries', formatInteger(manifest.study.designMatrixEntries));
    setText('#frame-name', manifest.frame);

    if (!availability.observers || !availability.grid) throw new Error('Observer or grid dataset is unavailable.');
    const [observers, grid] = await Promise.all([
      loadObserverDataset(manifest.datasets.observerTrajectories),
      Promise.resolve(buildGridDataset(manifest))
    ]);
    observerData = observers;
    scene.loadStudyData(grid, observers);

    addFamilyOptions(observers.families);
    renderFamilyLegend(observers.families);
    familySelect.disabled = false;
    slider.disabled = false;
    slider.max = String(observers.samplesPerObserver - 1);
    playButton.disabled = false;
    updateTime(0);
    setText('#family-count', `${observers.observerCount} observer slots shown`);
    setText('#zone-earth-count', formatInteger(grid.zoneCounts['Earth Local']));
    setText('#zone-moon-count', formatInteger(grid.zoneCounts['Lunar Local']));
    setText('#zone-cislunar-count', formatInteger(grid.zoneCounts['Cislunar Domain']));

    status.textContent = availability.coverage || availability.constellations
      ? 'Observer trajectories, domain grid, and optimization products loaded.'
      : 'JPL-seeded observer trajectories and the exact 4,782-cell domain grid are loaded. Coverage and optimized constellation arrays remain pending.';
    status.className = 'data-status ready';
  } catch (error) {
    status.textContent = error.message;
    status.className = 'data-status pending';
    stopPlayback();
    console.error(error);
  }
};

initialize();
