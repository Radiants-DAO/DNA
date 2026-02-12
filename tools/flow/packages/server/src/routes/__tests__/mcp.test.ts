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

  it("lists all 7 tools with flow_ prefix and annotations", async () => {
    const result = await client.listTools();
    expect(result.tools.length).toBe(7);
    const names = result.tools.map((t) => t.name).sort();
    expect(names).toEqual([
      "flow_get_animation_state",
      "flow_get_component_tree",
      "flow_get_design_audit",
      "flow_get_element_context",
      "flow_get_extracted_styles",
      "flow_get_mutation_diffs",
      "flow_get_page_tokens",
    ]);

    // Every tool should have read-only annotations
    for (const tool of result.tools) {
      expect(tool.annotations).toEqual({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      });
    }
  });

  it("flow_get_element_context returns enriched context with structuredContent", async () => {
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
      name: "flow_get_element_context",
      arguments: { selector: ".btn" },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.componentName).toBe("Button");
    expect(parsed.schema).toBeDefined();
    expect(parsed.dnaBindings).toBeDefined();
  });

  it("flow_get_element_context returns actionable error for unknown selector", async () => {
    const result = await client.callTool({
      name: "flow_get_element_context",
      arguments: { selector: ".nonexistent" },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain("flow_get_component_tree");
    expect(text).toContain(".nonexistent");
  });

  it("flow_get_element_context validates input with Zod", async () => {
    const result = await client.callTool({
      name: "flow_get_element_context",
      arguments: { selector: "" },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain("Invalid input");
    expect(text).toContain("selector");
  });

  it("flow_get_page_tokens returns brand and semantic tokens with pagination", async () => {
    writeFileSync(
      join(dir, "tokens.css"),
      `@theme {
        --color-sun-yellow: #FEF8E2;
        --color-surface-primary: #FFFFFF;
      }`
    );
    await deps.tokenParser.scan();

    const result = await client.callTool({
      name: "flow_get_page_tokens",
      arguments: {},
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.total).toBe(2);
    expect(parsed.brand.length).toBe(1);
    expect(parsed.semantic.length).toBe(1);
    // Pagination metadata
    expect(parsed.items).toBeDefined();
    expect(parsed.has_more).toBe(false);
  });

  it("flow_get_design_audit detects hardcoded colors in DNA", async () => {
    const compDir = join(dir, "components", "Badge");
    mkdirSync(compDir, { recursive: true });
    writeFileSync(
      join(compDir, "Badge.dna.json"),
      JSON.stringify({ tokens: { default: { background: "#FF0000" } } })
    );
    await deps.schemaResolver.scan();

    const result = await client.callTool({
      name: "flow_get_design_audit",
      arguments: {},
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.count).toBeGreaterThan(0);
    expect(parsed.violations[0].type).toBe("hardcoded-color");
  });

  it("flow_get_design_audit detects undefined token references", async () => {
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
      name: "flow_get_design_audit",
      arguments: {},
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.violations[0].type).toBe("undefined-token");
  });

  it("flow_get_mutation_diffs returns accumulated diffs", async () => {
    deps.contextStore.addMutation({
      selector: ".hero",
      property: "padding",
      before: "16px",
      after: "24px",
      timestamp: Date.now(),
    });

    const result = await client.callTool({
      name: "flow_get_mutation_diffs",
      arguments: {},
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.length).toBe(1);
    expect(parsed[0].property).toBe("padding");
  });

  it("flow_get_component_tree returns paginated tree", async () => {
    deps.contextStore.setComponentTree([
      { name: "App", children: [{ name: "Header" }, { name: "Main" }] },
    ]);

    const result = await client.callTool({
      name: "flow_get_component_tree",
      arguments: {},
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.items[0].name).toBe("App");
    expect(parsed.total).toBe(1);
    expect(parsed.has_more).toBe(false);
  });

  it("flow_get_animation_state returns paginated animation data", async () => {
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
      name: "flow_get_animation_state",
      arguments: { selector: ".hero" },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.items[0].animations[0].name).toBe("fadeIn");
    expect(parsed.total).toBe(1);
    expect(parsed.has_more).toBe(false);
  });

  it("flow_get_extracted_styles returns paginated style data", async () => {
    deps.contextStore.setExtractedStyles(".card", {
      colors: { primary: "#FEF8E2" },
      typography: { fontFamily: "Inter" },
    });

    const result = await client.callTool({
      name: "flow_get_extracted_styles",
      arguments: { selector: ".card" },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.items[0].colors.primary).toBe("#FEF8E2");
    expect(parsed.total).toBe(1);
    expect(parsed.has_more).toBe(false);
  });

  it("returns actionable error for unknown tool", async () => {
    const result = await client.callTool({
      name: "nonexistent_tool",
      arguments: {},
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain("Unknown tool");
    expect(text).toContain("flow_get_element_context");
  });
});
