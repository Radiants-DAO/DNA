# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 14 App Router project written in TypeScript.
- `src/app`: routes, layouts, and app-level providers (`layout.tsx`, `providers.tsx`, route `page.tsx` files).
- `src/components`: reusable UI and wallet/radiator components (for example, `Navbar.tsx`, `RadiatorBurner.tsx`).
- `src/utils`: shared helpers (for example, RPC and asset lookup helpers).
- `src/constants.ts`: shared configuration values (such as default RPC endpoint).
- `src/types`: shared type definitions.
- `public/`: static assets.

Use the TypeScript path alias `@/*` for internal imports (mapped to `src/*`).

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start local dev server at `http://localhost:3000`.
- `npm run lint`: run ESLint with `next/core-web-vitals`.
- `npm run build`: create production build.
- `npm run start`: serve the production build.

Note: there is currently no `npm test` script configured.

## Coding Style & Naming Conventions
- Follow TypeScript `strict` mode expectations; prefer explicit types for exported functions and component props.
- Use functional React components and keep route files in `src/app/**/page.tsx`.
- Name React components in `PascalCase` (for example, `Navbar.tsx`), and keep route folders lowercase (for example, `src/app/setup`).
- Use 2-space indentation and keep formatting/lint clean before opening a PR.
- Prefer `@/` imports over long relative paths.

## Testing Guidelines
Automated tests are not set up yet in this snapshot. For behavioral changes:
- Add targeted tests when introducing a test runner.
- Include manual verification steps in the PR (wallet connect/disconnect flow, setup flow, affected routes).
- Run `npm run lint` and `npm run build` before requesting review.

## Commit & Pull Request Guidelines
Git history is not available in this workspace snapshot (`.git` is missing), so use this convention:
- Commit format: `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`.
- Keep commits focused and atomic.
- PRs should include: change summary, reason for change, verification commands/results, linked issue, and UI screenshots for visual changes.

## Security & Configuration Tips
- Configure RPC with `NEXT_PUBLIC_RPC_ENDPOINT`; do not hardcode secrets or private keys.
- Default to devnet during development unless a mainnet change is explicitly required.
