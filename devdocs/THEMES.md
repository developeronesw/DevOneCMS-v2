# DevOne CMS 2.0 Themes

A theme controls the presentation layer. It must not implement CMS business logic, authentication, licensing, or provider-specific storage.

## 1. Responsibilities
Themes may control layout, templates, navigation presentation, typography, colors, responsive behavior, CSS, JavaScript, and presentation assets.

## 2. Recommended structure
```text
my-theme/
├── theme.json
├── theme.css
├── templates/
│   ├── index.html
│   ├── page.html
│   └── 404.html
├── parts/
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
└── README.md
```

## 3. Manifest
```json
{
  "name": "Acme Studio",
  "slug": "acme-studio",
  "version": "1.0.0",
  "description": "A responsive studio theme.",
  "author": "Acme",
  "license": "Commercial",
  "requires": { "devone": "2.0.0" }
}
```
The slug is stable and unique.

## 4. Data boundary
Templates consume Core-provided site/content data. They should never open the database directly. Conceptually: Core data → theme template → HTML → theme assets.

## 5. Settings
Use namespaced settings such as acme-studio.accent and acme-studio.layout. Keep credentials and secrets out of all client-visible files.

## 6. Quality
Production themes should support keyboard navigation, visible focus, semantic HTML, useful alt text, readable contrast, mobile layouts, reduced motion, and no hover-only critical interactions.

## 7. Theme API status
The package format above is the 2.0 theme contract. The repository contains example light/dark theme assets, but the complete dynamic theme loader/template runtime is still a separate implementation area. Until that loader is finalized, developers must not depend on undocumented template hooks.