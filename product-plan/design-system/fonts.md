# Typography Configuration

## Google Fonts Import

Add to your HTML `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Or import in CSS:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

## Font Usage

### Inter (Headings & Body)

Used for all UI text:

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

**Weight Classes:**
- Regular (400): Body text, descriptions
- Medium (500): Labels, nav items, buttons
- Semibold (600): Headings, emphasis
- Bold (700): Page titles, strong emphasis

### JetBrains Mono (Monospace)

Used for:
- IDs (e.g., `RV-00123`)
- Phone numbers
- Technical data
- Code snippets
- Campaign names

```css
font-family: 'JetBrains Mono', ui-monospace, monospace;
```

## Tailwind Classes

```html
<!-- Headings -->
<h1 class="text-xl font-semibold text-slate-900 dark:text-white">Page Title</h1>
<h2 class="text-lg font-semibold text-slate-900 dark:text-white">Section Title</h2>
<h3 class="text-base font-semibold text-slate-900 dark:text-white">Card Title</h3>

<!-- Body text -->
<p class="text-sm text-slate-600 dark:text-slate-300">Regular text</p>
<p class="text-sm font-medium text-slate-700 dark:text-slate-200">Emphasized text</p>

<!-- Muted/secondary text -->
<span class="text-xs text-slate-400 dark:text-slate-500">Muted text</span>

<!-- Monospace -->
<span class="font-mono text-sm text-slate-500 dark:text-slate-400">RV-00123</span>

<!-- Labels -->
<label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Label</label>
```

## Text Sizes

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Labels, badges, timestamps |
| `text-sm` | 14px | Body text, table cells |
| `text-base` | 16px | Larger body text |
| `text-lg` | 18px | Section headings |
| `text-xl` | 20px | Page titles |