# Publishing blog articles

The blog is a static GitHub Pages section. No framework, build step, or external service is required.

## Publish a new article

1. Copy the HTML template from `blog/article-template.html` to `blog/<slug>.html` (lowercase, hyphenated slug).
2. Replace the example title, description, date, category, and article body. Keep `<site-header root=".." current="blog">` and the stylesheet/script paths unchanged.
3. Add an entry to `blog/posts.json`:

```json
{
  "slug": "my-article",
  "title": "My Article",
  "date": "2026-10-11",
  "category": "Astrodynamics",
  "excerpt": "A short, plain-language introduction to the article."
}
```

4. Commit and push to the GitHub Pages branch. The listing will order articles newest first, and the category dropdown is generated from the published entries.

Only list articles in `posts.json` when the corresponding `blog/<slug>.html` file exists. Do not put drafts in the manifest. The template is intentionally not listed as a published article. Test locally using `python -m http.server 8000` because `blog.js` fetches the JSON manifest.
