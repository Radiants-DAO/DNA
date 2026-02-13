# fn-1-slv.1 Create package scaffolding and package.json

## Description
Create the package directory structure and package.json for @dna/radiants.

## Structure to create
```
packages/radiants/
├── package.json
├── fonts/
└── components/
    └── core/
```

## package.json content
- name: "@dna/radiants"
- version: "0.1.0"
- main: "./index.css"
- exports map for index.css, tokens, dark, components
- peerDependencies: react ^18 || ^19, tailwindcss ^4.0.0

Reference: DNA spec `/Users/rivermassey/Desktop/dev/dna/docs/theme-spec.md:719-736`
## Acceptance
- [ ] Directory created at `packages/radiants/`
- [ ] package.json has name "@dna/radiants"
- [ ] exports map includes "./", "./tokens", "./dark", "./components/core"
- [ ] peerDependencies defined for react and tailwindcss
- [ ] fonts/ directory exists
- [ ] components/core/ directory exists
## Done summary
Created packages/radiants/ directory structure with package.json containing @dna/radiants name, exports map, and peerDependencies for react and tailwindcss.
## Evidence
- Commits: a61c32b5cb484072375485808a841e6026c24498
- Tests:
- PRs: