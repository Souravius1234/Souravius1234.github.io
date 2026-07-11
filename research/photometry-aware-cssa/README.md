# Photometry-Aware Cislunar Surveillance Explorer

Interactive companion to the paper **Photometry-Aware Sensor Placement for Cislunar Space Situational Awareness**.

## Scope

The browser application will visualize precomputed scientific products only. CR3BP propagation, CLAP calibration, photometric evaluation, and mixed-integer optimization remain in the research codebase.

The first public version will include:

- Earth-Moon rotating-frame scene
- Earth, Moon, Lagrange points, and XGEO domain
- candidate and selected observer trajectories
- time-dependent grid-cell detectability and quality
- constellation-size selection
- zone-level coverage metrics
- paper, method, citation, and limitation panels

## Planned structure

```text
photometry-aware-cssa/
├── index.html
├── README.md
├── css/
│   └── explorer.css
├── js/
│   ├── main.js
│   ├── scene.js
│   ├── data-loader.js
│   ├── coverage-layer.js
│   ├── controls.js
│   └── charts.js
├── assets/
└── data/
    ├── manifest.json
    ├── grid.bin
    ├── observers.bin
    ├── constellations.json
    └── coverage/
```

## Data boundary

The web exporter should produce browser-ready files with this conceptual contract:

- `manifest.json`: dimensions, frame, units, available cases, and version metadata
- grid coordinates and zone IDs
- observer trajectory states and orbit-family labels
- optimized observer selections by constellation size
- quantized detectability or quality arrays
- aggregate and zone-stratified coverage summaries

Large generated source files remain excluded from this repository. Only compressed data required by the published page should be committed.

## Scientific limitation

The initial explorer represents the paper's attitude-agile photometric domain-coverage model. It does not model finite-FOV tasking, simultaneous observation conflicts, slew time, or scheduling.
