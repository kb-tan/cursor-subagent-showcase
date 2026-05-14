# Project Foundation: ui-assists

## Tech Stack
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **Package Manager:** npm
- **Dev Server:** http://localhost:5173

## Required Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies & scripts |
| `vite.config.ts` | Vite configuration |
| `tsconfig.json` | TypeScript config |
| `index.html` | HTML entry point |
| `src/main.tsx` | React mount point |
| `src/App.tsx` | Root component |
| `src/styles/tokens.css` | Design tokens as CSS variables |

## NPM Scripts
- `npm install` - Install dependencies
- `npm run dev` - Start dev server (port 5173)
- `npm run build` - Production build
- `npm run preview` - Preview production build

## Dev Server Requirements
Before building components, ensure dev server can start:
- [ ] `npm install` has been run
- [ ] `npm run dev` starts without errors
- [ ] Browser can access http://localhost:5173

## Component File Structure
```
src/
├── main.tsx              # React entry point
├── App.tsx               # Root component
├── styles/
│   └── tokens.css        # CSS variables from DESIGN_TOKENS.md
└── components/             # Component files from SPEC.md
    └── [ComponentName].tsx
```

## Notes
- All styling uses CSS variables from `tokens.css`
- No CSS-in-JS libraries
- No additional UI frameworks (no MUI, Chakra, etc.)
