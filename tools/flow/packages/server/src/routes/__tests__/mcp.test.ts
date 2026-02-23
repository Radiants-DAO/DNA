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
      broadcast: () => {},
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

  it("lists all 15 tools with flow_ prefix and annotations", async () => {
    const result = await client.listTools();
    expect(result.tools.length).toBe(15);
    const names = result.tools.map((t) => t.name).sort();
    expect(names).toEqual([
      "flow_get_animation_state",
      "flow_get_comments",
      "flow_get_component_tree",
      "flow_get_design_audit",
      "flow_get_design_changes",
      "flow_get_element_context",
      "flow_get_extracted_styles",
      "flow_get_mutation_diffs",
      "flow_get_page_tokens",
      "flow_get_pending_feedback",
      "flow_get_session_context",
      "flow_get_text_edits",
      "flow_post_feedback",
      "flow_reply_to_thread",
      "flow_resolve_annotation",
    ]);

    // Every tool should have annotations and output schema
    for (const tool of result.tools) {
      expect(tool.annotations).toBeDefined();
      expect(tool.outputSchema).toBeDefined();
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
    expect(parsed.items.length).toBe(1);
    expect(parsed.items[0].property).toBe("padding");
    expect(parsed.total).toBe(1);
    expect(parsed.has_more).toBe(false);
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

  it("accepts omitted arguments for tools with optional inputs", async () => {
    deps.contextStore.setComponentTree([{ name: "App" }]);

    const componentTree = await client.callTool({
      name: "flow_get_component_tree",
    });
    const componentTreeText = (
      componentTree.content as Array<{ type: string; text: string }>
    )[0].text;
    const parsedTree = JSON.parse(componentTreeText);
    expect(parsedTree.items.length).toBe(1);

    const designAudit = await client.callTool({
      name: "flow_get_design_audit",
    });
    expect(designAudit.isError).not.toBe(true);
  });

  it("flow_get_mutation_diffs paginates json session output", async () => {
    deps.contextStore.setSession(123, {
      textEdits: [{ id: "t1" }, { id: "t2" }],
      mutationDiffs: [{ id: "m1" }, { id: "m2" }],
      animationDiffs: [{ id: "n1" }, { id: "n2" }],
      comments: [{ id: "c1" }, { id: "c2" }],
      promptSteps: [{ id: "p1" }, { id: "p2" }],
      compiledMarkdown: "## Session changes",
      lastUpdated: Date.now(),
    });

    const result = await client.callTool({
      name: "flow_get_mutation_diffs",
      arguments: { tabId: 123, format: "json", limit: 1, offset: 1 },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.textEdits.items).toEqual([{ id: "t2" }]);
    expect(parsed.mutationDiffs.items).toEqual([{ id: "m2" }]);
    expect(parsed.comments.items).toEqual([{ id: "c2" }]);
  });

  it("flow_get_session_context returns compiled markdown by default", async () => {
    deps.contextStore.setSession(42, {
      compiledMarkdown: "## Design Changes\n- padding: 16px → 24px",
      textEdits: [],
      mutationDiffs: [],
      animationDiffs: [],
      comments: [],
      promptSteps: [],
      lastUpdated: Date.now(),
    });

    const result = await client.callTool({
      name: "flow_get_session_context",
      arguments: { tabId: 42 },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain("Design Changes");
    expect(text).toContain("padding");
  });

  it("flow_get_session_context returns JSON with format=json", async () => {
    deps.contextStore.setSession(42, {
      compiledMarkdown: "## Changes",
      textEdits: [],
      mutationDiffs: [],
      animationDiffs: [],
      comments: [{ id: "c1", text: "Fix this" }],
      promptSteps: [],
      lastUpdated: Date.now(),
    });

    const result = await client.callTool({
      name: "flow_get_session_context",
      arguments: { tabId: 42, format: "json" },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.comments).toEqual([{ id: "c1", text: "Fix this" }]);
  });

  it("flow_get_session_context returns error for no session", async () => {
    const result = await client.callTool({
      name: "flow_get_session_context",
      arguments: {},
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain("No active Flow session");
  });

  it("flow_get_comments returns paginated comments", async () => {
    deps.contextStore.setSession(42, {
      compiledMarkdown: "",
      textEdits: [],
      mutationDiffs: [],
      animationDiffs: [],
      comments: [{ id: "c1" }, { id: "c2" }, { id: "c3" }],
      promptSteps: [],
      lastUpdated: Date.now(),
    });

    const result = await client.callTool({
      name: "flow_get_comments",
      arguments: { tabId: 42, limit: 2, offset: 0 },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.items.length).toBe(2);
    expect(parsed.total).toBe(3);
    expect(parsed.has_more).toBe(true);
  });

  it("flow_get_design_changes returns paginated mutations", async () => {
    deps.contextStore.setSession(42, {
      compiledMarkdown: "",
      textEdits: [],
      mutationDiffs: [{ id: "m1", property: "color" }, { id: "m2", property: "padding" }],
      animationDiffs: [],
      comments: [],
      promptSteps: [],
      lastUpdated: Date.now(),
    });

    const result = await client.callTool({
      name: "flow_get_design_changes",
      arguments: { tabId: 42 },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.items.length).toBe(2);
    expect(parsed.total).toBe(2);
    expect(parsed.has_more).toBe(false);
  });

  it("flow_post_feedback creates feedback and returns id", async () => {
    const broadcastMessages: unknown[] = [];
    deps.broadcast = (msg) => broadcastMessages.push(msg);

    const result = await client.callTool({
      name: "flow_post_feedback",
      arguments: {
        tabId: 42,
        selector: ".hero",
        content: "Contrast too low",
        intent: "fix",
        severity: "important",
      },
    });

    expect(result.isError).not.toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.success).toBe(true);
    expect(parsed.id).toBeDefined();

    // Verify stored
    const pending = deps.contextStore.getPendingAgentFeedback(42);
    expect(pending.length).toBe(1);
    expect(pending[0].content).toBe("Contrast too low");

    // Verify broadcast
    expect(broadcastMessages.length).toBe(1);
    expect((broadcastMessages[0] as { type: string }).type).toBe("agent-feedback");
  });

  it("flow_resolve_annotation resolves feedback and broadcasts", async () => {
    const broadcastMessages: unknown[] = [];
    deps.broadcast = (msg) => broadcastMessages.push(msg);

    // First create feedback
    deps.contextStore.addAgentFeedback(42, {
      id: "fb-1",
      tabId: 42,
      role: "agent",
      intent: "fix",
      severity: "important",
      status: "pending",
      selector: ".hero",
      content: "Contrast too low",
      thread: [],
      timestamp: Date.now(),
    });

    const result = await client.callTool({
      name: "flow_resolve_annotation",
      arguments: { tabId: 42, id: "fb-1", summary: "Fixed contrast" },
    });

    expect(result.isError).not.toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.success).toBe(true);
    expect(parsed.status).toBe("resolved");

    const feedback = deps.contextStore.getAgentFeedback(42, "fb-1");
    expect(feedback?.status).toBe("resolved");
    expect(broadcastMessages.length).toBe(1);
  });

  it("flow_resolve_annotation returns error for unknown id", async () => {
    const result = await client.callTool({
      name: "flow_resolve_annotation",
      arguments: { tabId: 42, id: "nonexistent", summary: "Fixed" },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain("No feedback found");
    expect(text).toContain("flow_get_pending_feedback");
  });

  it("flow_reply_to_thread adds reply and broadcasts", async () => {
    const broadcastMessages: unknown[] = [];
    deps.broadcast = (msg) => broadcastMessages.push(msg);

    deps.contextStore.addAgentFeedback(42, {
      id: "fb-2",
      tabId: 42,
      role: "agent",
      intent: "question",
      severity: "suggestion",
      status: "pending",
      selector: ".btn",
      content: "Should this be primary?",
      thread: [],
      timestamp: Date.now(),
    });

    const result = await client.callTool({
      name: "flow_reply_to_thread",
      arguments: { tabId: 42, id: "fb-2", content: "Yes, make it primary." },
    });

    expect(result.isError).not.toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.success).toBe(true);
    expect(parsed.threadLength).toBe(1);

    expect(broadcastMessages.length).toBe(1);
    expect((broadcastMessages[0] as { type: string }).type).toBe("agent-thread-reply");
  });

  it("flow_get_pending_feedback returns combined agent and human feedback", async () => {
    deps.contextStore.addAgentFeedback(42, {
      id: "fb-3",
      tabId: 42,
      role: "agent",
      intent: "fix",
      severity: "blocking",
      status: "pending",
      selector: ".card",
      content: "Missing token",
      thread: [],
      timestamp: Date.now(),
    });

    deps.contextStore.setSession(42, {
      compiledMarkdown: "",
      textEdits: [],
      mutationDiffs: [],
      animationDiffs: [],
      comments: [{ id: "hc-1", content: "User comment" }],
      promptSteps: [],
      lastUpdated: Date.now(),
    });

    const result = await client.callTool({
      name: "flow_get_pending_feedback",
      arguments: { tabId: 42 },
    });

    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.total).toBe(2);
    expect(parsed.items.length).toBe(2);
    expect(parsed.has_more).toBe(false);
  });
});
