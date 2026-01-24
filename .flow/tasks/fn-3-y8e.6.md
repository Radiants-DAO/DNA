# fn-3-y8e.6 Create dna.config.json

## Description
Create `packages/radiants/dna.config.json` per spec (Section 10.1):
```json
{
  "name": "radiants",
  "displayName": "Radiants",
  "version": "1.0.0",
  "description": "Retro pixel aesthetic with warm colors",
  "colorModes": { "default": "light", "available": ["light", "dark"] },
  "fonts": { "heading": "Joystix Monospace", "body": "Mondwest", "mono": "PixelCode" }
}
```
## Acceptance
- [ ] dna.config.json created
- [ ] Valid JSON format
- [ ] Contains required fields (name, displayName, colorModes, fonts)
## Done summary
Created dna.config.json with theme metadata including name, displayName, version, description, colorModes (light/dark), and font mappings (heading, body, mono) per DNA spec Section 10.1.
## Evidence
- Commits: fa98217fa3c4194f1575907567bbf90e61826e14
- Tests: node JSON.parse validation
- PRs: