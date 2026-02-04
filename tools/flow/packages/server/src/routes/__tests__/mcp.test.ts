import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createMcpServer, type McpDependencies } from "../mcp.js";
import { SchemaResolver } from "../../services/schema-resolver.js";
import { TokenParser } from "../../services/token-parser.js";
import { SourceMapService } from "../../services/source-maps.js";
import { ContextStore } from "../../services/context-store.js";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

describe("MCP Tools", () => {
  let dir: string;
  let deps: McpDependencies;
  let client: Client;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "flow-mcp-"));
    deps = {
      schemaResolver: new SchemaResolver(dir),
      tokenParser: new TokenParser(dir),
      sourceMapService: new SourceMapService(dir),
      contextStore: new ContextStore(),
    };

    const server = createMcpServer(deps);
    client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("lists all 7 tools", async () => {
    const result = await client.listTools();
    expect(result.tools.length).toBe(7);
    const names = result.tools.map((t) => t.name).sort();
    expect(names).toEqual([
      "get_animation_state",
      "get_component_tree",
      "get_design_audit",
      "get_element_context",
      "get_extracted_styles",
      "get_mutation_diffs",
      "get_page_tokens",
    ]);
  });

  it("get_element_context returns enriched context", async () => {
    deps.contextStore.setElementContext(".btn", {
      selector: ".btn",
      componentName: "Button",
      filePath: "src/Button.tsx",
      line: 10,
      props: { variant: "primary" },
    });

    const compDir = join(dir, "components", "Button");
    mkdirSync(compDir, { recursive: true });
    writeFileSync(
      join(compDir, "Button.schema.json"),
      JSON.stringify({ props: { variant: { type: "string" } } })
    );
    writeFileSync(
      join(compDir, "Button.dna.json"),
      JSON.stringify({ tokens: { primary: { bg: "var(--color-brand-sun)" } } })
    );
    await deps.schemaResolver.scan();

    const result = await client.callTool({
      name: "get_element_context",
      arguments: { selector: ".btn" },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.componentName).toBe("Button");
    expect(parsed.schema).toBeDefined();
    expect(parsed.dnaBindings).toBeDefined();
  });

  it("get_page_tokens returns brand and semantic tokens", async () => {
    writeFileSync(
      join(dir, "tokens.css"),
      `@theme {
        --color-sun-yellow: #FEF8E2;
        --color-surface-primary: #FFFFFF;
      }`
    );
    await deps.tokenParser.scan();

    const result = await client.callTool({
      name: "get_page_tokens",
      arguments: {},
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.total).toBe(2);
    expect(parsed.brand.length).toBe(1);
    expect(parsed.semantic.length).toBe(1);
  });

  it("get_design_audit detects hardcoded colors in DNA", async () => {
    const compDir = join(dir, "components", "Badge");
    mkdirSync(compDir, { recursive: true });
    writeFileSync(
      join(compDir, "Badge.dna.json"),
      JSON.stringify({ tokens: { default: { background: "#FF0000" } } })
    );
    await deps.schemaResolver.scan();

    const result = await client.callTool({
      name: "get_design_audit",
      arguments: {},
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.count).toBeGreaterThan(0);
    expect(parsed.violations[0].type).toBe("hardcoded-color");
  });

  it("get_design_audit detects undefined token references", async () => {
    const compDir = join(dir, "components", "Badge");
    mkdirSync(compDir, { recursive: true });
    writeFileSync(
      join(compDir, "Badge.dna.json"),
      JSON.stringify({ tokens: { default: { background: "var(--color-nonexistent)" } } })
    );
    writeFileSync(join(dir, "tokens.css"), "@theme { --color-sun: #FEF8E2; }");
    await deps.schemaResolver.scan();
    await deps.tokenParser.scan();

    const result = await client.callTool({
      name: "get_design_audit",
      arguments: {},
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.violations[0].type).toBe("undefined-token");
  });

  it("get_mutation_diffs returns accumulated diffs", async () => {
    deps.contextStore.addMutation({
      selector: ".hero",
      property: "padding",
      before: "16px",
      after: "24px",
      timestamp: Date.now(),
    });

    const result = await client.callTool({
      name: "get_mutation_diffs",
      arguments: {},
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.length).toBe(1);
    expect(parsed[0].property).toBe("padding");
  });

  it("get_component_tree returns the tree", async () => {
    deps.contextStore.setComponentTree([
      { name: "App", children: [{ name: "Header" }, { name: "Main" }] },
    ]);

    const result = await client.callTool({
      name: "get_component_tree",
      arguments: {},
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed[0].name).toBe("App");
  });

  it("get_animation_state returns animation data", async () => {
    deps.contextStore.setAnimationState(".hero", {
      selector: ".hero",
      animations: [
        {
          name: "fadeIn",
          type: "css",
          duration: 300,
          delay: 0,
          easing: "ease-out",
          keyframes: [{ opacity: 0 }, { opacity: 1 }],
          playState: "running",
        },
      ],
    });

    const result = await client.callTool({
      name: "get_animation_state",
      arguments: { selector: ".hero" },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed[0].animations[0].name).toBe("fadeIn");
  });

  it("get_extracted_styles returns style data", async () => {
    deps.contextStore.setExtractedStyles(".card", {
      colors: { primary: "#FEF8E2" },
      typography: { fontFamily: "Inter" },
    });

    const result = await client.callTool({
      name: "get_extracted_styles",
      arguments: { selector: ".card" },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed[0].colors.primary).toBe("#FEF8E2");
  });
});
