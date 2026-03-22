import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { generateSchemas } from "../generate-schemas";

const FIXTURE_DIR = join(import.meta.dirname, "__fixture__");

function setupFixture() {
  rmSync(FIXTURE_DIR, { recursive: true, force: true });
  mkdirSync(join(FIXTURE_DIR, "Input"), { recursive: true });

  // Input.meta.ts — has tokenBindings
  writeFileSync(
    join(FIXTURE_DIR, "Input", "Input.meta.ts"),
    `import type { ComponentMeta } from "../../types";
export const InputMeta: ComponentMeta = {
  name: "Input",
  description: "Text input",
  props: { placeholder: { type: "string" } },
  tokenBindings: { base: { background: "--color-page" } },
};`
  );

  // Label.meta.ts — no tokenBindings
  writeFileSync(
    join(FIXTURE_DIR, "Input", "Label.meta.ts"),
    `import type { ComponentMeta } from "../../types";
export const LabelMeta: ComponentMeta = {
  name: "Label",
  description: "Form label",
  props: { htmlFor: { type: "string" } },
};`
  );

  // TextArea.meta.ts — no tokenBindings
  writeFileSync(
    join(FIXTURE_DIR, "Input", "TextArea.meta.ts"),
    `import type { ComponentMeta } from "../../types";
export const TextAreaMeta: ComponentMeta = {
  name: "TextArea",
  description: "Multi-line text input",
  props: { rows: { type: "number" } },
};`
  );
}

describe("generate-schemas", () => {
  beforeEach(setupFixture);
  afterEach(() => rmSync(FIXTURE_DIR, { recursive: true, force: true }));

  it("finds all *.meta.ts files and emits schema.json for each", async () => {
    const barrelPath = join(FIXTURE_DIR, "meta-index.ts");
    await generateSchemas(FIXTURE_DIR, barrelPath);

    expect(existsSync(join(FIXTURE_DIR, "Input", "Input.schema.json"))).toBe(true);
    expect(existsSync(join(FIXTURE_DIR, "Input", "Label.schema.json"))).toBe(true);
    expect(existsSync(join(FIXTURE_DIR, "Input", "TextArea.schema.json"))).toBe(true);
  });

  it("does not emit dna.json files", async () => {
    const barrelPath = join(FIXTURE_DIR, "meta-index.ts");
    await generateSchemas(FIXTURE_DIR, barrelPath);

    expect(existsSync(join(FIXTURE_DIR, "Input", "Input.dna.json"))).toBe(false);
    expect(existsSync(join(FIXTURE_DIR, "Input", "Label.dna.json"))).toBe(false);
    expect(existsSync(join(FIXTURE_DIR, "Input", "TextArea.dna.json"))).toBe(false);
  });

  it("removes orphaned schema files when no matching meta remains", async () => {
    const barrelPath = join(FIXTURE_DIR, "meta-index.ts");
    const orphanSchemaPath = join(FIXTURE_DIR, "Input", "Legacy.schema.json");

    writeFileSync(
      orphanSchemaPath,
      JSON.stringify({ name: "Legacy", description: "Old component", props: {} }, null, 2) + "\n"
    );

    expect(existsSync(orphanSchemaPath)).toBe(true);

    await generateSchemas(FIXTURE_DIR, barrelPath);

    expect(existsSync(orphanSchemaPath)).toBe(false);
  });

  it("schema.json excludes tokenBindings and registry fields", async () => {
    const barrelPath = join(FIXTURE_DIR, "meta-index.ts");
    await generateSchemas(FIXTURE_DIR, barrelPath);

    const schema = JSON.parse(readFileSync(join(FIXTURE_DIR, "Input", "Input.schema.json"), "utf-8"));
    expect(schema.name).toBe("Input");
    expect(schema.tokenBindings).toBeUndefined();
    expect(schema.registry).toBeUndefined();
  });

  it("writes a barrel file with entries for each discovered meta", async () => {
    const barrelPath = join(FIXTURE_DIR, "meta-index.ts");
    await generateSchemas(FIXTURE_DIR, barrelPath);

    expect(existsSync(barrelPath)).toBe(true);
    const barrel = readFileSync(barrelPath, "utf-8");
    expect(barrel).toContain("Input");
    expect(barrel).toContain("Label");
    expect(barrel).toContain("TextArea");
    expect(barrel).toContain("componentMetaIndex");
  });

  it("writes a minimal schema barrel without dna or legacy helper exports", async () => {
    const metaBarrelPath = join(FIXTURE_DIR, "meta-index.ts");
    const schemaBarrelPath = join(FIXTURE_DIR, "schemas-index.ts");
    await generateSchemas(FIXTURE_DIR, metaBarrelPath, schemaBarrelPath);

    expect(existsSync(schemaBarrelPath)).toBe(true);
    const barrel = readFileSync(schemaBarrelPath, "utf-8");
    expect(barrel).not.toContain('Dna');
    expect(barrel).toContain('Label: { schema: LabelSchema }');
    expect(barrel).toContain("componentData");
    expect(barrel).not.toContain("componentNames");
    expect(barrel).not.toContain("export const schemas");
    expect(barrel).not.toContain("getComponentData");
  });
});
