# Interactive research applications

Each subdirectory contains a self-contained browser-based companion to a paper or research project.

## Required structure

```text
research/<project-slug>/
├── index.html
├── README.md
├── css/
├── js/
├── assets/
└── data/
```

## Requirements

- Use only relative URLs.
- Keep the application deployable as static files through GitHub Pages.
- Separate scientific data generation from browser visualization.
- Store the data schema in the project README.
- Include a visible methods and limitations statement.
- Include links back to `../../research.html` and the site home page.
- Avoid duplicating large global assets when an existing shared asset is suitable.

## Current application

- [`photometry-aware-cssa/`](photometry-aware-cssa/) — interactive companion for the photometry-aware cislunar surveillance constellation-design paper.
