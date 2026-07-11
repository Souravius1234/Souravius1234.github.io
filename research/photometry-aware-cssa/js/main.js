import { CSSAScene } from './scene.js';
import { loadManifest, hasStudyData } from './data-loader.js';

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

bindLayerToggle('#toggle-axes', 'axes');
bindLayerToggle('#toggle-lagrange', 'lagrange');
bindLayerToggle('#toggle-xgeo', 'xgeo');

window.addEventListener('resize', () => scene.resize());
document.querySelector('#reset-view')?.addEventListener('click', () => scene.resetView());
document.querySelector('#planar-view')?.addEventListener('click', () => scene.setPlanarView());

const initialize = async () => {
  try {
    const manifest = await loadManifest();
    setText('#metric-observers', formatInteger(manifest.study.candidateObservers));
    setText('#metric-cells', formatInteger(manifest.study.gridCells));
    setText('#metric-times', formatInteger(manifest.study.timeSamples));
    setText('#metric-entries', formatInteger(manifest.study.designMatrixEntries));
    setText('#frame-name', manifest.frame);

    const status = document.querySelector('#data-status');
    if (hasStudyData(manifest)) {
      status.textContent = 'Scientific datasets detected and ready to load.';
      status.className = 'data-status ready';
    } else {
      status.textContent = 'Geometry shell active. Observer, grid, coverage, and constellation exports are not yet committed.';
      status.className = 'data-status pending';
    }
  } catch (error) {
    const status = document.querySelector('#data-status');
    status.textContent = error.message;
    status.className = 'data-status pending';
    console.error(error);
  }
};

initialize();
