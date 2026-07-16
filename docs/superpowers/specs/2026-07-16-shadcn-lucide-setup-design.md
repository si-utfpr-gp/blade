# shadcn/ui + lucide-react Setup

## Context
Rails + React 19 + esbuild + Tailwind v4 project. No Vite/Next.js.

## Goal
Install lucide-react and set up shadcn/ui components progressively, starting with Button.

## Packages
- `lucide-react` (icons)
- `clsx` + `tailwind-merge` (cn() utility)
- `class-variance-authority` (component variants)

## Structure
```
app/javascript/
├── lib/
│   └── utils.ts              # cn() helper
└── components/
    └── ui/
        └── button.tsx         # shadcn Button component
```

## Approach
Manual setup (no shadcn CLI) since the project uses esbuild, not Vite/Next.js.

## Future
Add more components (Card, Input, Dialog, etc.) as needed — no need to install everything upfront.
