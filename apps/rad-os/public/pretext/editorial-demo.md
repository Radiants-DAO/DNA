# The Future Of Text Layout

Pretext turns markdown into a document model that can flow through multiple text primitives without rewriting the underlying content contract.

It keeps the source format plain enough to export, diff, paste, and reload while still carrying a second typed file for renderer-specific settings.

> Fast text layout is not a visual flourish. It is infrastructure for content apps.

- Markdown remains the source of truth.
- Settings stay typed and explicit.
- Renderers can specialize without inventing new authoring formats.

---

```ts
const bundle = await loadPretextBundle('/pretext/editorial-demo');
```

![Editorial hero](hero)
