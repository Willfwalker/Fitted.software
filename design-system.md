# Fitted Agency — Design System Reference

## Tokens (defined in globals.css)
- **BG:** `--bg: #0B0B0B` | `--bg-elevated: #131110` | `--bg-card: #1A1816`
- **Text:** `--text: #E8E0D4` | `--text-muted: #8A817A` | `--text-dim: #5A534D`
- **Accent:** `--accent: #D4734E` | `--accent-hover: #E8845D` | `--accent-glow: rgba(212,115,78,0.15)`
- **Border:** `--border: #2A2520` | `--border-light: rgba(232,224,212,0.06)`
- **Fonts:** `--font-display: "Instrument Serif"` (headings) | `--font-body: "Outfit"` (everything else, weight 300 default)

## Page Padding (MANDATORY for every dashboard page)
Every page inside `app/(dashboard)/` MUST use this wrapper pattern:
```tsx
<div className="p-6 sm:p-8 lg:p-12 max-w-[1400px] space-y-6">
  <div className="animate-dash-in">
    <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--accent)] mb-2 block">
      Module Label
    </span>
    <h1 className="font-[family-name:var(--font-display)] text-[2.2rem] text-[var(--text)] leading-tight">
      Page Title
    </h1>
  </div>
  {/* page content */}
</div>
```
- `p-6` mobile | `sm:p-8` tablet | `lg:p-12` desktop — ensures content never touches edges
- `max-w-[1400px]` prevents ultra-wide layouts
- `space-y-6` consistent vertical rhythm between sections

## Component Styling Rules
- **Cards:** `bg-[var(--bg-card)] border border-[var(--border)] rounded-lg`
- **Inputs:** `bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)]`
- **Tables:** header text `text-[var(--text-muted)] text-[0.75rem] font-medium uppercase tracking-wider`, row hover `hover:bg-[rgba(232,224,212,0.02)]`
- **Buttons (primary):** accent bg, pill shape, `14px 36px` padding
- **Section labels:** `text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--accent)]`
- **Active nav:** `bg-[rgba(212,115,78,0.08)] text-[var(--text)]` | Hover: `hover:bg-[rgba(232,224,212,0.03)]`

## Tailwind v4 Rules
- **NEVER** use opacity modifiers on CSS variables: `bg-[var(--bg-card)]/80` is BROKEN
- **ALWAYS** use rgba instead: `bg-[rgba(26,24,22,0.8)]`
- shadcn style: `new-york` | Icons: `lucide` | Radius: `0.625rem`

## Layout Structure
- Sidebar: fixed 260px (`lg:pl-[260px]` on main), hidden on mobile
- Header: 56px (`h-14`), hidden on mobile
- Grids: collapse at `lg:` (1024px) for sidebar, `sm:` (640px) for content grids
- Dashboard KPI grids: `grid-cols-2 lg:grid-cols-4 gap-2`

## Animation
- Page entrance: `animate-dash-in` (fade-up 0.55s cubic-bezier)
- Body has grain overlay at `opacity: 0.03` — do not add competing noise textures
- Accent glow on hero elements: `box-shadow: 0 0 80px var(--accent-glow)`

## Always Dark. No Light Mode. No Exceptions.
