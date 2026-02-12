import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { defineEventHandler, readBody, getMethod, setResponseStatus } from "h3";
import { z } from "zod";
import type { SchemaResolver } from "../services/schema-resolver.js";
import type { TokenParser } from "../services/token-parser.js";
import type { SourceMapService } from "../services/source-maps.js";
import type { ContextStore } from "../services/context-store.js";

export interface McpDependencies {
  schemaResolver: SchemaResolver;
  tokenParser: TokenParser;
  sourceMapService: SourceMapService;
  contextStore: ContextStore;
}

// ---------- Zod input schemas ----------

const PaginationFields = {
  limit: z.number().int().min(1).max(500).default(50),
  offset: z.number().int().min(0).default(0),
};

const GetElementContextInput = z.object({
  selector: z.string().min(1, "selector must be a non-empty CSS selector"),
});

const GetComponentTreeInput = z.object({
  ...PaginationFields,
});

const GetPageTokensInput = z.object({
  ...PaginationFields,
});

const GetDesignAuditInput = z.object({});

const GetAnimationStateInput = z.object({
  selector: z.string().optional(),
  ...PaginationFields,
});

const GetExtractedStylesInput = z.object({
  selector: z.string().optional(),
  ...PaginationFields,
});

const GetMutationDiffsInput = z.object({
  tabId: z.number().optional(),
  format: z.enum(["markdown", "json"]).optional(),
});

// ---------- Shared annotations (all tools are read-only) ----------

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

// ---------- Pagination input schema fragment (JSON Schema) ----------

const PAGINATION_PROPERTIES = {
  limit: {
    type: "number",
    description: "Maximum number of items to return (1-500, default 50)",
  },
  offset: {
    type: "number",
    description: "Number of items to skip (default 0)",
  },
} as const;

// ---------- Tool definitions ----------

const TOOLS = [
  {
    name: "flow_get_element_context",
    description:
      "Get full context for a DOM element: component name, file path, line number, props, applied tokens, schema metadata, DNA bindings, and parent component chain.",
    inputSchema: {
      type: "object" as const,
      properties: {
        selector: { type: "string", description: "CSS selector for the element" },
      },
      required: ["selector"],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "flow_get_component_tree",
    description:
      "Get the full React component tree with source locations, component names, prop summaries, and child counts.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ...PAGINATION_PROPERTIES,
      },
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "flow_get_page_tokens",
    description:
      "Get all CSS custom properties defined in the project, grouped by tier (brand vs semantic), with current values per color mode.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ...PAGINATION_PROPERTIES,
      },
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "flow_get_design_audit",
    description:
      "Audit the project for DNA violations: hardcoded colors, missing tokens, non-semantic token usage, motion violations. Each violation includes file:line and a suggested fix.",
    inputSchema: { type: "object" as const, properties: {} },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "flow_get_animation_state",
    description:
      "Get all active animations (CSS, WAAPI, GSAP) with targets, properties, keyframes, timing, easing, and playback state.",
    inputSchema: {
      type: "object" as const,
      properties: {
        selector: { type: "string", description: "Optional CSS selector to filter" },
        ...PAGINATION_PROPERTIES,
      },
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "flow_get_extracted_styles",
    description:
      "Get extracted styles: clustered color palette, typography scale, spacing scale, layout structure, shadows, and radii.",
    inputSchema: {
      type: "object" as const,
      properties: {
        selector: { type: "string", description: "Optional CSS selector to filter" },
        ...PAGINATION_PROPERTIES,
      },
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "flow_get_mutation_diffs",
    description:
      "Get all accumulated visual changes from the current Flow session, structured as source-resolved instructions for an LLM. Returns compiled markdown by default, or raw JSON.",
    inputSchema: {
      type: "object" as const,
      properties: {
        tabId: {
          type: "number",
          description: "Browser tab ID to get diffs from. Omit for the most recently active tab.",
        },
        format: {
          type: "string",
          enum: ["markdown", "json"],
          description: "Output format. Default: markdown.",
        },
      },
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
];

// ---------- Helpers ----------

function paginate<T>(items: T[], offset: number, limit: number) {
  const page = items.slice(offset, offset + limit);
  return {
    items: page,
    total: items.length,
    offset,
    limit,
    has_more: offset + limit < items.length,
  };
}

function zodError(err: z.ZodError, toolName: string) {
  const fieldErrors = err.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  return {
    content: [
      {
        type: "text" as const,
        text: `Invalid input for ${toolName}:\n${fieldErrors}\n\nCheck the tool's inputSchema for expected types and required fields.`,
      },
    ],
    isError: true,
  };
}

// ---------- Server factory ----------

export function createMcpServer(deps: McpDependencies): Server {
  const server = new Server(
    { name: "flow-mcp-server", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "flow_get_element_context": {
        let parsed: z.infer<typeof GetElementContextInput>;
        try {
          parsed = GetElementContextInput.parse(args);
        } catch (err) {
          return zodError(err as z.ZodError, name);
        }

        const { selector } = parsed;
        const liveContext = deps.contextStore.getElementContext(selector);

        if (!liveContext) {
          return {
            content: [
              {
                type: "text",
                text: `No element context found for selector '${selector}'. Try calling flow_get_component_tree first to discover available selectors, or verify the selector matches an element on the current page.`,
              },
            ],
            isError: true,
          };
        }

        const componentName = liveContext.componentName;
        const schemaEntry = componentName
          ? deps.schemaResolver.get(componentName)
          : undefined;
        const tokenBindings = componentName
          ? deps.schemaResolver.resolveTokenBindings(componentName)
          : null;

        const result = {
          selector,
          ...liveContext,
          schema: schemaEntry?.schema ?? null,
          dnaBindings: tokenBindings,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
          structuredContent: result,
        };
      }

      case "flow_get_component_tree": {
        let parsed: z.infer<typeof GetComponentTreeInput>;
        try {
          parsed = GetComponentTreeInput.parse(args);
        } catch (err) {
          return zodError(err as z.ZodError, name);
        }

        const tree = deps.contextStore.getComponentTree();
        const result = paginate(tree, parsed.offset, parsed.limit);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      }

      case "flow_get_page_tokens": {
        let parsed: z.infer<typeof GetPageTokensInput>;
        try {
          parsed = GetPageTokensInput.parse(args);
        } catch (err) {
          return zodError(err as z.ZodError, name);
        }

        const index = deps.tokenParser.getIndex();
        const allTokens = index.all;
        const paged = paginate(allTokens, parsed.offset, parsed.limit);
        const result = {
          brand: index.byTier.brand,
          semantic: index.byTier.semantic,
          total: allTokens.length,
          ...paged,
        };
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
          structuredContent: result,
        };
      }

      case "flow_get_design_audit": {
        try {
          GetDesignAuditInput.parse(args);
        } catch (err) {
          return zodError(err as z.ZodError, name);
        }

        const components = deps.schemaResolver.getAll();
        const tokenIndex = deps.tokenParser.getIndex();
        const tokenNames = new Set(tokenIndex.all.map((t) => t.name));
        const violations: Array<{
          type: string;
          component: string;
          file: string | null;
          detail: string;
          suggestion: string;
        }> = [];

        for (const comp of components) {
          if (!comp.dna) continue;
          for (const [variant, bindings] of Object.entries(comp.dna.tokens)) {
            for (const [prop, value] of Object.entries(bindings)) {
              if (/^#[0-9a-fA-F]{3,8}$/.test(value)) {
                violations.push({
                  type: "hardcoded-color",
                  component: comp.name,
                  file: comp.dna.filePath,
                  detail: `${prop} in variant "${variant}" uses hardcoded color ${value}`,
                  suggestion: `Use a token reference like var(--color-surface-primary) instead of ${value}`,
                });
              }
              const varMatch = value.match(/var\((--[\w-]+)\)/);
              if (varMatch && !tokenNames.has(varMatch[1])) {
                violations.push({
                  type: "undefined-token",
                  component: comp.name,
                  file: comp.dna.filePath,
                  detail: `${prop} in variant "${variant}" references undefined token ${varMatch[1]}`,
                  suggestion: `Define ${varMatch[1]} in your tokens.css @theme block, or use one of the existing tokens: ${tokenIndex.all.slice(0, 5).map((t) => t.name).join(", ")}${tokenIndex.all.length > 5 ? "..." : ""}`,
                });
              }
            }
          }
        }

        const result = { violations, count: violations.length };
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
          structuredContent: result,
        };
      }

      case "flow_get_animation_state": {
        let parsed: z.infer<typeof GetAnimationStateInput>;
        try {
          parsed = GetAnimationStateInput.parse(args);
        } catch (err) {
          return zodError(err as z.ZodError, name);
        }

        const states = deps.contextStore.getAnimationState(parsed.selector);
        const result = paginate(states, parsed.offset, parsed.limit);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      }

      case "flow_get_extracted_styles": {
        let parsed: z.infer<typeof GetExtractedStylesInput>;
        try {
          parsed = GetExtractedStylesInput.parse(args);
        } catch (err) {
          return zodError(err as z.ZodError, name);
        }

        const styles = deps.contextStore.getExtractedStyles(parsed.selector);
        const result = paginate(styles, parsed.offset, parsed.limit);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      }

      case "flow_get_mutation_diffs": {
        let parsed: z.infer<typeof GetMutationDiffsInput>;
        try {
          parsed = GetMutationDiffsInput.parse(args);
        } catch (err) {
          return zodError(err as z.ZodError, name);
        }

        const { tabId, format } = parsed;
        const session = deps.contextStore.getSession(tabId ?? undefined);

        if (!session) {
          const diffs = deps.contextStore.getMutations();
          if (diffs.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: "No active Flow session found and no changes accumulated. Open a page in Chrome with the Flow extension active, make some visual changes, then try again.",
                },
              ],
            };
          }
          return {
            content: [{ type: "text", text: JSON.stringify(diffs, null, 2) }],
            structuredContent: { diffs },
          };
        }

        if (format === "json") {
          const result = {
            annotations: session.annotations,
            textEdits: session.textEdits,
            mutationDiffs: session.mutationDiffs,
            animationDiffs: session.animationDiffs,
            comments: session.comments,
            promptSteps: session.promptSteps,
          };
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
            structuredContent: result,
          };
        }

        // Default: markdown format
        return {
          content: [
            {
              type: "text",
              text: session.compiledMarkdown || "No changes accumulated in this session yet.",
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: '${name}'. Available tools: ${TOOLS.map((t) => t.name).join(", ")}`,
            },
          ],
          isError: true,
        };
    }
  });

  return server;
}

/**
 * Create h3 event handler for the /__mcp endpoint.
 * Uses Streamable HTTP transport per MCP spec.
 */
export function createMcpHandler(deps: McpDependencies) {
  const transports = new Map<string, StreamableHTTPServerTransport>();

  return defineEventHandler(async (event) => {
    const method = getMethod(event);

    if (method === "POST") {
      const body = await readBody(event);
      const sessionId = event.headers.get("mcp-session-id");

      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports.has(sessionId)) {
        transport = transports.get(sessionId)!;
      } else {
        const server = createMcpServer(deps);
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID(),
        });
        await server.connect(transport);

        // Store transport after connection establishes session
        if (transport.sessionId) {
          transports.set(transport.sessionId, transport);
        }
      }

      // Delegate to the transport's request handler
      const req = event.node.req;
      const res = event.node.res;

      await transport.handleRequest(req, res, body);
    } else if (method === "DELETE") {
      const sessionId = event.headers.get("mcp-session-id");
      if (sessionId && transports.has(sessionId)) {
        const transport = transports.get(sessionId)!;
        await transport.close();
        transports.delete(sessionId);
      }
      setResponseStatus(event, 200);
      return { ok: true };
    } else {
      setResponseStatus(event, 405);
      return { error: "Method not allowed" };
    }
  });
}
