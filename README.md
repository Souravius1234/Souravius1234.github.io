# Sourav Ghosh — Personal Website

Static portfolio and research website published through GitHub Pages at `souravius1234.github.io`.

## Technology

- Static HTML
- Tailwind CSS through CDN
- Three.js ES modules through CDN
- GitHub Pages deployment from `main`

No build step is currently required.

## Repository map

```text
.
├── index.html                  # Landing page
├── About Me.html               # Current about page; retained for URL compatibility
├── research.html               # Research catalogue
├── projects.html               # Project catalogue
├── contact.html                # Contact page
├── assets/                     # Legacy template CSS, JavaScript, fonts, and Sass
├── images/                     # Shared site imagery and logos
├── models/                     # 3D model assets
├── Docs/                       # CV and downloadable documents
├── pubs/                       # Publication PDFs
├── projects/                   # Detailed project pages
├── sideprojects/               # Standalone side-project pages
├── research/                   # Interactive research companions and research-specific data
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

- Keep the root limited to public top-level pages and repository metadata.
- Put detailed project pages under `projects/`.
- Put interactive paper companions under `research/<project-slug>/`.
- Put shared images in `images/`; keep project-specific assets inside their project directory.
- Use forward slashes in HTML paths, including on Windows.
- Preserve existing public URLs until redirects or compatibility pages are provided.
- Do not commit generated scientific datasets unless they are compressed and required by the published interactive page.

## Current research companion

The photometry-aware cislunar surveillance explorer will be developed under:

```text
research/photometry-aware-cssa/
```

Its data-export contract and implementation notes will remain inside that directory.
