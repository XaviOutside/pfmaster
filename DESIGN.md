---
name: PetCare Management System
colors:
  surface: '#fdfae7'
  surface-dim: '#dddbc8'
  surface-bright: '#fdfae7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f4e1'
  surface-container: '#f1eedb'
  surface-container-high: '#ece9d6'
  surface-container-highest: '#e6e3d0'
  on-surface: '#1c1c11'
  on-surface-variant: '#3d4947'
  inverse-surface: '#313124'
  inverse-on-surface: '#f4f1de'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a60'
  primary: '#00685d'
  on-primary: '#ffffff'
  primary-container: '#008376'
  on-primary-container: '#f4fffb'
  inverse-primary: '#6fd8c8'
  secondary: '#765a05'
  on-secondary: '#ffffff'
  secondary-container: '#ffd87c'
  on-secondary-container: '#795d08'
  tertiary: '#286182'
  on-tertiary: '#ffffff'
  tertiary-container: '#447a9c'
  on-tertiary-container: '#fcfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#8cf5e4'
  primary-fixed-dim: '#6fd8c8'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005048'
  secondary-fixed: '#ffdf96'
  secondary-fixed-dim: '#e7c268'
  on-secondary-fixed: '#251a00'
  on-secondary-fixed-variant: '#5a4400'
  tertiary-fixed: '#c7e7ff'
  tertiary-fixed-dim: '#98cdf2'
  on-tertiary-fixed: '#001e2e'
  on-tertiary-fixed-variant: '#064c6b'
  background: '#fdfae7'
  on-background: '#1c1c11'
  surface-variant: '#e6e3d0'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  card-padding: 24px
---

# PawManage — Design System

> **Source**: Stitch project "Dog Grooming Manager"
> **Imported**: 2026-07-05
> **Tailwind implementation**: `src/index.css` (`@theme` block)
> **Design tokens**: Material 3 tonal palette (Fidelity variant)

---

## Brand & Style

The brand personality is dependable yet warm, striking a balance between a professional business tool and the nurturing environment of a pet grooming salon. It aims to evoke feelings of trust, cleanliness, and approachability for both salon owners and pet parents.

The design system utilizes a **Modern Corporate** style with a soft, consumer-facing edge. It leverages heavy whitespace, a refined card-based architecture, and gentle depth to create a focused, stress-free user experience. The aesthetic avoids clinical coldness by using organic curves and a palette inspired by natural elements like water and sand.

## Colors

This design system uses a palette that balances hygiene with warmth.

| Role | Token | Hex | Usage |
|---|---|---|---|
| **Primary** | `primary` | `#2a9d8f` | Main actions, brand presence, CTA buttons |
| **Secondary** | `secondary` | `#e9c46a` | Accents, highlights, friendly contrast |
| **Tertiary** | `tertiary` | `#457b9d` | Information, status updates, links |
| **Neutral** | `surface` | `#fdfae7` | Background, soft warmth |
| **Error** | `error` | `#ba1a1a` | Destructive actions, validation errors |

### Override colors (active in implementation)

| Token | Stitch override | Replaces |
|---|---|---|
| Primary | `#2a9d8f` | `#00685d` |
| Secondary | `#e9c46a` | `#765a05` |
| Tertiary | `#457b9d` | `#286182` |
| Neutral | `#f4f1de` | — |

### Surface hierarchy

```
background          #fdfae7  — page background
surface             #fdfae7  — main surface
surface-dim         #dddbc8  — inactive/dimmed surface
surface-bright      #fdfae7  — elevated bright surface
surface-container-lowest   #ffffff  — cards, highest contrast
surface-container-low      #f7f4e1  — secondary containers
surface-container          #f1eedb  — standard containers
surface-container-high     #ece9d6  — prominent containers
surface-container-highest  #e6e3d0  — most prominent containers
```

## Typography

The system uses **Montserrat** for headlines to provide a bold, geometric, and confident personality. **Inter** is used for all body text and UI labels to ensure maximum legibility and a systematic, modern feel.

Hierarchies are established primarily through weight and size. Headlines should remain concise. For mobile views, large display type scales down significantly to maintain readability without excessive scrolling.

### Scale

| Token | Family | Size | Weight | Line height | Letter spacing |
|---|---|---|---|---|---|
| `display-lg` | Montserrat | 48px / 3rem | 700 | 56px / 3.5rem | -0.02em |
| `headline-lg` | Montserrat | 32px / 2rem | 600 | 40px / 2.5rem | — |
| `headline-md` | Montserrat | 24px / 1.5rem | 600 | 32px / 2rem | — |
| `body-lg` | Inter | 18px / 1.125rem | 400 | 28px / 1.75rem | — |
| `body-md` | Inter | 16px / 1rem | 400 | 24px / 1.5rem | — |
| `label-md` | Inter | 14px / 0.875rem | 500 | 20px / 1.25rem | 0.05em |
| `caption` | Inter | 12px / 0.75rem | 400 | 16px / 1rem | — |

### Usage guidelines

- **display-lg**: Hero titles, landing page main heading
- **headline-lg**: Section headings on landing pages
- **headline-md**: Page titles, card headers, modal titles
- **body-lg**: Lead paragraphs, introductory text
- **body-md**: Body text, table content, form labels
- **label-md**: Navigation items, button text, field labels, table headers
- **caption**: Helper text, timestamps, meta info, footer text

### Tailwind class mapping

| Token | Tailwind v4 class |
|---|---|
| `display-lg` | `text-display-lg` |
| `headline-lg` | `text-headline-lg` |
| `headline-md` | `text-headline-md` |
| `body-lg` | `text-body-lg` |
| `body-md` | `text-body-md` |
| `label-md` | `text-label-md` |
| `caption` | `text-caption` |

Font family classes: `font-headline` (Montserrat), `font-body` (Inter).

## Layout & Spacing

The design system employs a **Fluid Grid** model based on an 8px base unit.

| Breakpoint | Columns | Gutter | Margin |
|---|---|---|---|
| Desktop | 12 | 24px | 40px |
| Tablet | 8 | 16px | 24px |
| Mobile | 4 | 16px | 16px |

Spacing should be generous to maintain a "clean" and "airy" feel, which reduces the cognitive load for busy salon managers.

### Spacing tokens

| Token | Value | Tailwind v4 class |
|---|---|---|
| Unit | 8px / 0.5rem | `p-unit`, `m-unit`, `gap-unit` |
| Gutter | 24px / 1.5rem | `px-gutter`, `gap-gutter` |
| Card padding | 24px / 1.5rem | `p-card-padding` |
| Desktop margin | 40px / 2.5rem | `mx-[--spacing-margin-desktop]` |
| Mobile margin | 16px / 1rem | `mx-[--spacing-margin-mobile]` |
| Container max | 1280px | `max-w-[--container-max]` |

## Elevation & Depth

Hierarchy is conveyed through **Tonal Layers** and **Ambient Shadows**.

| Level | Use case | Shadow | Tailwind v4 class |
|---|---|---|---|
| 0 | Background (page) | None | `bg-background` |
| 1 | Cards, surface containers | `0 4px 12px rgba(42,157,143,0.04)` | `shadow-card` |
| 2 | Modals, popovers, dialogs | `0 8px 24px rgba(42,157,143,0.08)` | `shadow-modal` |

Outlines are avoided unless used for interactive states (e.g., input focus). Depth should feel natural and light, never heavy or distracting.

## Shapes

This design system uses a **Rounded** shape language to reinforce the "friendly" and "safe" brand attributes.

| Token | Value | Use case | Tailwind v4 class |
|---|---|---|---|
| `sm` | 4px / 0.25rem | Tight corners, small elements | `rounded-sm` |
| `md` | 8px / 0.5rem | Buttons, inputs, standard elements | `rounded-md` |
| `lg` | 12px / 0.75rem | Intermediate containers | `rounded-lg` |
| `xl` | 16px / 1rem | Cards, modals, large containers | `rounded-xl` |
| `2xl` | 24px / 1.5rem | Hero/feature containers | `rounded-2xl` |
| `full` | 9999px | Badges, chips, avatars | `rounded-full` |

## Components

### Buttons

Primary buttons use the Teal background with white text. Secondary buttons use a Teal outline or a light beige tint. CTAs should have a minimum height of 48px to remain "tap-friendly."

```tsx
// Primary CTA
<Button variant="primary">Book Appointment</Button>

// Secondary
<Button variant="secondary">Cancel</Button>

// Danger / Destructive
<Button variant="danger">Delete</Button>

// Ghost (invisible background, for toolbars)
<Button variant="ghost">Back</Button>
```

### Cards

The primary container for the UI. Cards should have 24px internal padding and use the Level 1 shadow. Group pet information, appointments, and customer details into distinct cards.

```tsx
<div className="rounded-xl bg-surface-container-lowest p-card-padding shadow-card">
  <h2 className="font-headline text-headline-md text-on-surface">Title</h2>
  <p className="text-body-md text-on-surface-variant">Content</p>
</div>
```

### Chips / Badges

Small, pill-shaped tags used for status indicators, grooming services, or pet attributes. Use light tints of the primary/secondary colors.

```tsx
<Badge color="green">Active</Badge>
<Badge color="gray">Inactive</Badge>
<Badge color="blue">Info</Badge>
<Badge color="red">Error</Badge>
<Badge color="yellow">Warning</Badge>
```

### Input Fields

Soft grey borders (1px) that transition to a 2px Teal border on focus. Use Inter for input text.

```tsx
<Input label="Name" required />
<Select label="Status" options={[...]} />
```

### Iconography

Use a rounded, medium-stroke icon set. Prefer inline SVGs with `strokeWidth={2}` or `strokeWidth={1.5}` for the friendly aesthetic.

| Context | Icon |
|---|---|
| Dogs / Pets | Paw print, heart |
| Customers | Person silhouette |
| Services | Scissors, bathtub, brush |
| Actions | Plus (+), search magnifying glass, calendar |

### Lists / Tables

Clean rows with 1px light divider lines. Ensure high contrast for pet names and appointment times.

```tsx
<div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card">
  <table className="min-w-full divide-y divide-outline-variant">
    {/* rows */}
  </table>
</div>
```

### Navigation

Top header uses sticky positioning with backdrop blur. Active nav links use `text-primary`, inactive links use `text-on-surface-variant`. The brand logo uses the paw-print heart SVG icon.

```tsx
<header className="sticky top-0 z-40 border-b border-outline-variant bg-surface/95 backdrop-blur-sm">
  <nav>...</nav>
</header>
```

## Implementation Checklist

- [x] Color palette imported to `src/index.css` `@theme`
- [x] Typography scale defined as `--text-*` tokens
- [x] Font families: Montserrat (headlines), Inter (body)
- [x] Border radius tokens defined
- [x] Spacing tokens defined
- [x] Shadow tokens: `shadow-card`, `shadow-modal`
- [x] Atoms: Button, Input, Badge, Modal, Select, Spinner
- [x] Molecules: SearchBar, StatusBadge, Pagination, ConfirmDialog, Forms
- [x] Organisms: Tables, Detail Cards
- [x] App shell: Header, navigation, layout
- [x] Landing page: Hero, services preview, about, CTAs
- [ ] Appointments UI
- [ ] Mobile-responsive navigation (bottom nav)
- [ ] Dark mode support

---

*Generated from Stitch — "Dog Grooming Manager" project*
