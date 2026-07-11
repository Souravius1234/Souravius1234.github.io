# Sourav Ghosh — Personal Website

Static portfolio and research website published through GitHub Pages at `souravius1234.github.io`.

## Technology

- Static HTML
- Tailwind CSS through CDN
- Three.js ES modules through CDN
- Shared vanilla JavaScript web components
- GitHub Pages deployment from `main`

No build step is required.

## Repository map

```text
.
├── index.html                  # Custom landing page and Three.js hero
├── about.html                  # Canonical about page
├── About Me.html               # Compatibility redirect to about.html
├── research.html               # Research catalogue
├── projects.html               # Project catalogue
├── contact.html                # Contact form and contact links
├── assets/
│   ├── css/site.css            # Shared site styles
│   ├── js/site.js              # Shared navigation, footer, and reveal behavior
│   ├── js/starfield.js         # Reusable Three.js starfield
│   └── ...                     # Retained legacy template assets
├── images/                     # Shared imagery and logos
├── models/                     # 3D model assets
├── Docs/                       # CV and downloadable documents
├── pubs/                       # Publication PDFs
├── projects/                   # Detailed project pages
├── sideprojects/               # Standalone side-project pages
├── research/                   # Interactive research companions and project data
├── docs/                       # Repository and development documentation
└── archive/                    # Retired pages and legacy material
```

The intended structure and migration rules are documented in [`docs/REPOSITORY_STRUCTURE.md`](docs/REPOSITORY_STRUCTURE.md).

## Local development

Run a local static server from the repository root. Do not open pages directly with `file://`, because ES modules and data loading may be blocked by the browser.

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Development rules

- Keep the repository root limited to public top-level pages and repository metadata.
- Put detailed project pages under `projects/`.
- Put interactive paper companions under `research/<project-slug>/`.
- Put shared behavior and styling under `assets/`.
- Put shared images in `images/`; keep project-specific assets inside their project directory.
- Use forward slashes in HTML paths, including on Windows.
- Preserve existing public URLs with compatibility redirects when filenames change.
- Do not commit large generated scientific datasets unless they are compressed and required by a published interactive page.
- Use the shared `<site-header>` and `<site-footer>` components on standard content pages.

## Current research companion

The photometry-aware cislunar surveillance explorer is located at:

```text
research/photometry-aware-cssa/
```

The permanent route already exists. Three.js scene implementation and scientific data integration will be developed there.
