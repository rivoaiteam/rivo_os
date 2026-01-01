# Tailwind Color Configuration

## Color Choices

- **Primary:** `blue` — Used for buttons, links, key accents, active states
- **Secondary:** `amber` — Used for SLA warnings, alerts, highlights
- **Neutral:** `slate` — Used for backgrounds, text, borders

## Usage Examples

### Primary (Blue)
```html
<!-- Buttons -->
<button class="bg-blue-600 hover:bg-blue-700 text-white">Primary Button</button>

<!-- Links -->
<a class="text-blue-600 hover:text-blue-700 dark:text-blue-400">Link</a>

<!-- Active nav item -->
<button class="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">Active</button>

<!-- Focus rings -->
<input class="focus:ring-2 focus:ring-blue-500" />
```

### Secondary (Amber)
```html
<!-- SLA warning -->
<span class="text-amber-600 dark:text-amber-400">2h left</span>

<!-- Warning badge -->
<span class="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">Warning</span>

<!-- Highlight -->
<div class="bg-amber-50 dark:bg-amber-900/20 border-amber-200">Highlighted</div>
```

### Neutral (Slate)
```html
<!-- Backgrounds -->
<div class="bg-slate-50 dark:bg-slate-900">Page background</div>
<div class="bg-white dark:bg-slate-800">Card background</div>

<!-- Text -->
<p class="text-slate-900 dark:text-white">Primary text</p>
<p class="text-slate-600 dark:text-slate-300">Secondary text</p>
<p class="text-slate-400 dark:text-slate-500">Muted text</p>

<!-- Borders -->
<div class="border border-slate-200 dark:border-slate-700">Container</div>
```

## Dark Mode

Always include dark mode variants for all colors:

```html
<!-- Background -->
bg-white dark:bg-slate-800

<!-- Text -->
text-slate-900 dark:text-white
text-slate-600 dark:text-slate-300

<!-- Borders -->
border-slate-200 dark:border-slate-700

<!-- Hover states -->
hover:bg-slate-100 dark:hover:bg-slate-700
```

## Status Colors

| Status | Light Mode | Dark Mode |
|--------|------------|-----------|
| Success | `bg-emerald-100 text-emerald-700` | `bg-emerald-900/40 text-emerald-300` |
| Warning | `bg-amber-100 text-amber-700` | `bg-amber-900/40 text-amber-300` |
| Error | `bg-red-100 text-red-700` | `bg-red-900/40 text-red-300` |
| Info | `bg-blue-100 text-blue-700` | `bg-blue-900/40 text-blue-300` |
| Neutral | `bg-slate-100 text-slate-600` | `bg-slate-700 text-slate-400` |

## Status Badges

Use consistent badge styling across all pages. Badges should be compact with square corners and medium font weight.

### Badge Base Classes
```html
<!-- Standard badge -->
<span class="px-2 py-0.5 text-xs font-medium rounded">Badge Text</span>
```

**Required classes:**
- `px-2 py-0.5` - Compact padding
- `text-xs` - Small text size
- `font-medium` - Medium font weight (500)
- `rounded` - Subtle square corners (not `rounded-full`)

### Badge Color Scheme
| State | Classes | Use For |
|-------|---------|---------|
| Active/Success | `bg-emerald-100 text-emerald-700` | Active, New, Eligible, Converted, Live |
| Warning | `bg-amber-100 text-amber-700` | Incubation, Untrusted |
| Inactive/Neutral | `bg-slate-200 text-slate-500` | Inactive, Pending, Not Proceeding, Withdrawn, Paused |
| Error/Danger | `bg-red-100 text-red-700` | Not Eligible, Declined, Error states |

### Usage Examples
```html
<!-- Active status -->
<span class="px-2 py-0.5 text-xs font-medium rounded bg-emerald-100 text-emerald-700">Active</span>

<!-- Inactive status -->
<span class="px-2 py-0.5 text-xs font-medium rounded bg-slate-200 text-slate-500">Inactive</span>

<!-- Error/Declined status -->
<span class="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700">Declined</span>

<!-- Warning status -->
<span class="px-2 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-700">Incubation</span>
```

### Click-to-Cycle Status Pattern
For toggleable status badges, use a button element that cycles through status options:
```tsx
const statusOptions = [
  { value: 'active', label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'inactive', label: 'Inactive', color: 'bg-slate-200 text-slate-500' },
]

<button
  onClick={() => cycleStatus(currentStatus)}
  className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(status)}`}
>
  {getStatusLabel(status)}
</button>
```