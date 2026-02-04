import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SchemaResolver } from "../schema-resolver.js";

describe("SchemaResolver", () => {
  let dir: string;
  let resolver: SchemaResolver;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "flow-schema-"));
    resolver = new SchemaResolver(dir);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("discovers and indexes .schema.json files", async () => {
    const compDir = join(dir, "components", "Button");
    mkdirSync(compDir, { recursive: true });
    writeFileSync(
      join(compDir, "Button.schema.json"),
      JSON.stringify({
        props: { variant: { type: "string", enum: ["primary", "secondary"] } },
      })
    );

    await resolver.scan();

    const entry = resolver.get("Button");
    expect(entry).toBeDefined();
    expect(entry!.schema).toBeDefined();
    expect(entry!.schema!.props).toHaveProperty("variant");
  });

  it("discovers and indexes .dna.json files", async () => {
    const compDir = join(dir, "components", "Button");
    mkdirSync(compDir, { recursive: true });
    writeFileSync(
      join(compDir, "Button.dna.json"),
      JSON.stringify({
        tokens: {
          default: { background: "var(--color-surface-primary)" },
          primary: { background: "var(--color-brand-sun)" },
        },
      })
    );

    await resolver.scan();

    const entry = resolver.get("Button");
    expect(entry).toBeDefined();
    expect(entry!.dna).toBeDefined();
    expect(entry!.dna!.tokens.primary.background).toBe("var(--color-brand-sun)");
  });

  it("links source files to component entries", async () => {
    const compDir = join(dir, "components", "Card");
    mkdirSync(compDir, { recursive: true });
    writeFileSync(join(compDir, "Card.schema.json"), JSON.stringify({ props: {} }));
    writeFileSync(join(compDir, "Card.tsx"), "export const Card = () => null;");

    await resolver.scan();

    const entry = resolver.get("Card");
    expect(entry!.sourceFile).toContain("Card.tsx");
  });

  it("links .jsx source files", async () => {
    const compDir = join(dir, "components", "Badge");
    mkdirSync(compDir, { recursive: true });
    writeFileSync(join(compDir, "Badge.schema.json"), JSON.stringify({ props: {} }));
    writeFileSync(join(compDir, "Badge.jsx"), "export const Badge = () => null;");

    await resolver.scan();

    const entry = resolver.get("Badge");
    expect(entry!.sourceFile).toContain("Badge.jsx");
  });

  it("resolves token bindings for a component", async () => {
    const compDir = join(dir, "components", "Alert");
    mkdirSync(compDir, { recursive: true });
    writeFileSync(
      join(compDir, "Alert.dna.json"),
      JSON.stringify({
        tokens: {
          default: { border: "var(--color-edge-primary)" },
          error: { border: "var(--color-status-error)" },
        },
      })
    );

    await resolver.scan();

    const bindings = resolver.resolveTokenBindings("Alert");
    expect(bindings).toBeDefined();
    expect(bindings!.error.border).toBe("var(--color-status-error)");
  });

  it("returns undefined for unknown components", () => {
    expect(resolver.get("NonExistent")).toBeUndefined();
  });

  it("invalidates by file path", async () => {
    const compDir = join(dir, "components", "Tag");
    mkdirSync(compDir, { recursive: true });
    writeFileSync(join(compDir, "Tag.schema.json"), JSON.stringify({ props: {} }));

    await resolver.scan();
    expect(resolver.get("Tag")).toBeDefined();

    resolver.invalidateByPath(join(compDir, "Tag.schema.json"));
    expect(resolver.get("Tag")).toBeUndefined();
  });

  it("getAll returns all indexed components", async () => {
    const dir1 = join(dir, "components", "A");
    const dir2 = join(dir, "components", "B");
    mkdirSync(dir1, { recursive: true });
    mkdirSync(dir2, { recursive: true });
    writeFileSync(join(dir1, "A.schema.json"), JSON.stringify({ props: {} }));
    writeFileSync(join(dir2, "B.schema.json"), JSON.stringify({ props: {} }));

    await resolver.scan();

    const all = resolver.getAll();
    expect(all.length).toBe(2);
    expect(all.map((e) => e.name).sort()).toEqual(["A", "B"]);
  });

  it("returns null for resolveTokenBindings on component without DNA", async () => {
    const compDir = join(dir, "components", "Plain");
    mkdirSync(compDir, { recursive: true });
    writeFileSync(join(compDir, "Plain.schema.json"), JSON.stringify({ props: {} }));

    await resolver.scan();

    expect(resolver.resolveTokenBindings("Plain")).toBeNull();
  });
});
