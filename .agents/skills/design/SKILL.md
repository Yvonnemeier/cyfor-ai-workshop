# Design Skill

You are applying the **Cyfor Resource Manager design system** to a React + TailwindCSS v4 frontend.

Read `DESIGN.md` in the repository root for the full token reference and rationale.

## Quick reference

| Token | Value | Use for |
|-------|-------|---------|
| `bg` | `#f4f7fa` | Page background |
| `surface` | `#ffffff` | Cards and panels |
| `border` | `#cdd7e0` | All borders and dividers |
| `text-primary` | `#18293d` | Body text |
| `text-secondary` | `#4c637a` | Helper text, metadata |
| `action` | `#1b3d5e` | Primary buttons |
| `badge-bg / badge-text` | `#e4ecf4 / #1b3d5e` | Resource-type chips |
| `error` | `#b91c1c` | Error messages |

## Rules to enforce

1. **No shadows, gradients, or textures** — remove any `shadow-*`, `bg-gradient-*`, or backdrop effects.
2. **Colour only where it carries meaning** — the only coloured element is the primary action button and badge; everything else is neutral.
3. **Border on focus, not glow** — replace `focus:ring-*` with `focus:border-[#1b3d5e]` and `outline-none`.
4. **Cards use border, not shadow** — `border border-[#cdd7e0] rounded-lg bg-white p-4`.
5. **Disabled state** — use `disabled:bg-[#9aabb8] disabled:text-white` on primary buttons; `disabled:text-[#9aabb8]` on ghost buttons.

## Checklist when restyling a component

- [ ] Page background is `bg-[#f4f7fa]`
- [ ] All cards/panels: `bg-white border border-[#cdd7e0] rounded-lg p-4` — no shadow
- [ ] Text hierarchy: heading `font-semibold text-[#18293d]`, secondary `text-[#4c637a] text-sm`
- [ ] Primary button: `bg-[#1b3d5e] text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-[#153050] disabled:bg-[#9aabb8]`
- [ ] Ghost button: `border border-[#cdd7e0] text-[#18293d] rounded-md px-3 py-1 text-sm hover:bg-[#f4f7fa]`
- [ ] Inputs: `border border-[#cdd7e0] rounded-md px-3 py-2 text-sm outline-none focus:border-[#1b3d5e]`
- [ ] Resource-type badge: `bg-[#e4ecf4] text-[#1b3d5e] text-xs font-medium uppercase tracking-wide px-2 py-0.5 rounded`
- [ ] Error text: `text-[#b91c1c] text-sm`
- [ ] No `shadow-*` classes anywhere in the component
