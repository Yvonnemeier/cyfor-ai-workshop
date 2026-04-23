# Design System — Cyfor Resource Manager

This document captures the design principles and tokens used in this project.
The visual direction is informed by the Forsvaret brand guidelines (clean Nordic aesthetic,
large light surfaces, no decorative effects) and adapted for a resource-management web app.

> **Note:** Forsvaret's official visual profile — including exact brand colours, the Cera Pro
> typeface, and the logo — is copyright-protected and restricted to approved suppliers.
> This project uses an *inspired* palette derived from the publicly stated principles
> (Norwegian natural tones, arctic-white surfaces, calm and controlled colour use).

---

## Principles

| Principle | What it means in practice |
|-----------|--------------------------|
| **Clean and light** | Light backgrounds, generous whitespace, no decorative shadows or gradients |
| **No visual noise** | Avoid drop-shadows, texture, gradients, skewed edges, or glow effects |
| **Calm colour use** | Colour is used sparingly; only where it carries meaning (action, state, error) |
| **Clear hierarchy** | Typography weight and size, not colour, establish importance |
| **Legible at a glance** | Short labels, consistent spacing, obvious affordances |

---

## Colour Tokens

These tokens are defined as Tailwind CSS `@theme` custom properties in `web/src/index.css`.

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#f4f7fa` | Page background (arctic-white tint) |
| `--color-surface` | `#ffffff` | Card / panel surface |
| `--color-border` | `#cdd7e0` | Borders, dividers |
| `--color-text-primary` | `#18293d` | Body text, headings |
| `--color-text-secondary` | `#4c637a` | Captions, helper text |
| `--color-action` | `#1b3d5e` | Primary buttons, links |
| `--color-action-hover` | `#153050` | Hover state for primary action |
| `--color-badge-bg` | `#e4ecf4` | Resource-type badge background |
| `--color-badge-text` | `#1b3d5e` | Resource-type badge text |
| `--color-error` | `#b91c1c` | Error messages |
| `--color-disabled` | `#9aabb8` | Disabled controls |

---

## Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Page heading | Inter (system fallback) | 600 | `1.25rem` |
| Section heading | Inter | 500 | `0.875rem` |
| Body / form labels | Inter | 400 | `0.875rem` |
| Badge / meta | Inter | 500 | `0.75rem` uppercase |
| Error / helper | Inter | 400 | `0.875rem` |

Inter is a clean, neutral typeface suitable for data-dense interfaces and accessible at small sizes.
It is used as a drop-in since the official Cera Pro font requires a Forsvaret supplier licence.

---

## Component Patterns

### Cards / panels
- Background: `--color-surface`
- Border: `1px solid --color-border`
- Radius: `0.5rem`
- Padding: `1rem`
- **No box-shadow**

### Inputs
- Border: `1px solid --color-border`
- Focus ring: border darkens to `--color-action`, no glow
- Radius: `0.375rem`
- **No inner shadow**

### Primary button
- Background: `--color-action`
- Text: white
- Hover: `--color-action-hover`
- Disabled: `--color-disabled` bg, white text

### Secondary / ghost button
- Background: transparent
- Border: `1px solid --color-border`
- Text: `--color-text-primary`

### Resource-type badge
- Background: `--color-badge-bg`
- Text: `--color-badge-text`, uppercase, `0.7rem`, tracking-wide

---

## Do / Don't

| ✅ Do | ❌ Don't |
|-------|---------|
| Use whitespace generously | Add box-shadows to cards |
| Keep the palette to the tokens above | Introduce gradients or textures |
| Use navy for primary actions only | Use navy as a background colour |
| Show errors in `--color-error` | Use red for non-error states |
| Keep button labels short and clear | Use icons without text labels |
