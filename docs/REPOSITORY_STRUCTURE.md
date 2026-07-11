# Repository structure

This repository is deployed directly by GitHub Pages. Structural changes must therefore preserve public URLs or provide compatibility pages.

## Target layout

```text
.
├── index.html
├── About Me.html
├── research.html
├── projects.html
├── contact.html
├── assets/
│   ├── css/
│   ├── js/
│   ├── sass/
│   └── webfonts/
├── images/
├── models/
├── Docs/
├── pubs/
├── projects/
│   └── <project-slug>/ or <project-page>.html
├── research/
│   └── <research-slug>/
│       ├── index.html
│       ├── css/
│       ├── js/
│       ├── assets/
│       └── data/
├── sideprojects/
├── docs/
└── archive/
```

## Directory responsibilities

### Root

Only public top-level navigation pages and repository metadata belong at the root. Experimental pages, project details, and research applications should not be added here.

### `assets/`

Shared site-wide CSS, JavaScript, Sass, fonts, and third-party template resources. Existing HTML5 UP assets are legacy dependencies and should not be deleted until every page that uses them has been audited.

### `images/`

Shared logos, backgrounds, profile images, and cross-page imagery. Research-specific figures should live with their research application unless they are reused elsewhere.

### `Docs/`

Existing public document path retained for compatibility. A later migration to lowercase `docs-downloads/` or similar must include updated links and compatibility handling.

### `pubs/`

Publication PDFs exposed through the research catalogue. File names should be stable after publication.

### `projects/`

Detailed pages for portfolio projects. New project pages should use lowercase, hyphenated names.

### `research/`

Interactive companions to papers and research projects. Each project must be self-contained and use relative paths so it can run under GitHub Pages.

Recommended project structure:

```text
research/<slug>/
├── index.html
├── README.md
├── css/
├── js/
├── assets/
└── data/
    ├── manifest.json
    └── generated/       # ignored; produced by the scientific export pipeline
```

### `archive/`

Retired pages and template experiments. Archived content is not part of the supported public navigation and may retain legacy dependencies.

## Naming rules

- Use lowercase, hyphenated directory and file names for all new work.
- Use forward slashes in URLs and HTML paths.
- Avoid spaces in new file names.
- Existing paths such as `About Me.html` and `Docs/` remain until a compatibility migration is completed.
- Do not use absolute local filesystem paths.

## Data policy for interactive research pages

Commit only browser-ready, reproducible data products required by the published visualization.

Preferred formats:

- JSON for metadata and small tables
- Typed binary arrays for large tensors
- compressed static assets for trajectories and coverage maps

Do not commit raw MATLAB workspaces, intermediate CSV exports, caches, or complete simulation directories.

## Migration sequence

1. Add documentation and project scaffolds without changing public URLs.
2. Move unlinked experimental pages into `archive/`.
3. Extract repeated site CSS and JavaScript into shared modules.
4. Normalize path separators and repair mobile navigation links.
5. Introduce new lowercase page names only with compatibility redirects.
6. Build research applications inside isolated directories.
