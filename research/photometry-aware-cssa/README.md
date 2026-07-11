# Photometry-Aware Cislunar Surveillance Explorer

Interactive companion to the paper **Photometry-Aware Sensor Placement for Cislunar Space Situational Awareness**.

## Current implementation

The explorer now includes:

- Earth-Moon synodic rotating-frame scene
- Earth, Moon, barycenter, L1-L5, axes, and the Earth-centered XGEO boundary
- the exact 4,782-cell planar surveillance grid reconstructed from the study configuration
- Earth Local, Lunar Local, and Cislunar Domain macro-zones
- 64 JPL-seeded CR3BP observer slots across halo, Lyapunov, DRO, short-period, long-period, and resonant families
- compressed trajectory loading, family filtering, moving observer markers, timeline scrubbing, and playback

Photometric coverage tensors and optimized constellation selections are not yet connected.

## Data boundary

The browser visualizes precomputed scientific products only. CR3BP propagation, CLAP calibration, photometric evaluation, and mixed-integer optimization remain in the research codebase.

```text
photometry-aware-cssa/
├── index.html
├── README.md
├── css/
│   └── explorer.css
├── js/
│   ├── constants.js
│   ├── data-loader.js
│   ├── grid-layer.js
│   ├── lagrange.js
│   ├── main.js
│   ├── observer-layer.js
│   └── scene.js
└── data/
    ├── manifest.json
    ├── observer-meta-v2.json
    └── observer-positions-01.txt
```

The trajectory payload is quantized and delta encoded for static GitHub Pages delivery. The loader validates the expected observer, sample, component, and grid-cell counts before rendering.

## Next integration stage

The next dataset package should add:

- time-dependent detectability or quality arrays
- fixed-cardinality optimized selections
- minimum-cardinality selection
- aggregate and macro-zone coverage summaries
- selected-observer highlighting and coverage heatmaps

## Scientific limitation

The current explorer represents the paper's attitude-agile photometric domain-coverage model. It does not model finite-FOV tasking, simultaneous observation conflicts, slew time, or scheduling.
