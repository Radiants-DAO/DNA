import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { defineEventHandler, readBody, getMethod, setResponseStatus } from "h3";
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

const TOOLS = [
  {
    name: "get_element_context",
    description:
      "Get full context for a DOM element: component name, file path, line number, props, applied tokens, schema metadata, DNA bindings, and parent component chain.",
    inputSchema: {
      type: "object" as const,
      properties: {
        selector: { type: "string", description: "CSS selector for the element" },
      },
      required: ["selector"],
    },
  },
  {
    name: "get_component_tree",
    description:
      "Get the full React component tree with source locations, component names, prop summaries, and child counts.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_page_tokens",
    description:
      "Get all CSS custom properties defined in the project, grouped by tier (brand vs semantic), with current values per color mode.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_design_audit",
    description:
      "Audit the project for DNA violations: hardcoded colors, missing tokens, non-semantic token usage, motion violations. Each violation includes file:line and a suggested fix.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_animation_state",
    description:
      "Get all active animations (CSS, WAAPI, GSAP) with targets, properties, keyframes, timing, easing, and playback state.",
    inputSchema: {
      type: "object" as const,
      properties: {
        selector: { type: "string", description: "Optional CSS selector to filter" },
      },
    },
  },
  {
    name: "get_extracted_styles",
    description:
      "Get extracted styles: clustered color palette, typography scale, spacing scale, layout structure, shadows, and radii.",
    inputSchema: {
      type: "object" as const,
      properties: {
        selector: { type: "string", description: "Optional CSS selector to filter" },
      },
    },
  },
  {
    name: "get_mutation_diffs",
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
  },
];

export function createMcpServer(deps: McpDependencies): Server {
  const server = new Server(
    { name: "flow", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "get_element_context": {
        const selector = (args as { selector: string }).selector;
        const liveContext = deps.contextStore.getElementContext(selector);
        const componentName = liveContext?.componentName;
        const schemaEntry = componentName
          ? deps.schemaResolver.get(componentName)
          : undefined;
        const tokenBindings = componentName
          ? deps.schemaResolver.resolveTokenBindings(componentName)
          : null;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  selector,
                  ...(liveContext ?? {}),
                  schema: schemaEntry?.schema ?? null,
                  dnaBindings: tokenBindings,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_component_tree": {
        const tree = deps.contextStore.getComponentTree();
        return {
          content: [{ type: "text", text: JSON.stringify(tree, null, 2) }],
        };
      }

      case "get_page_tokens": {
        const index = deps.tokenParser.getIndex();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  brand: index.byTier.brand,
                  semantic: index.byTier.semantic,
                  total: index.all.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_design_audit": {
        // Audit: find components with DNA bindings that reference undefined tokens
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
              // Check for hardcoded hex colors
              if (/^#[0-9a-fA-F]{3,8}$/.test(value)) {
                violations.push({
                  type: "hardcoded-color",
                  component: comp.name,
                  file: comp.dna.filePath,
                  detail: `${prop} in variant "${variant}" uses hardcoded color ${value}`,
                  suggestion: `Use a token reference like var(--color-surface-primary) instead of ${value}`,
                });
              }
              // Check for var() references to undefined tokens
              const varMatch = value.match(/var\((--[\w-]+)\)/);
              if (varMatch && !tokenNames.has(varMatch[1])) {
                violations.push({
                  type: "undefined-token",
                  component: comp.name,
                  file: comp.dna.filePath,
                  detail: `${prop} in variant "${variant}" references undefined token ${varMatch[1]}`,
                  suggestion: `Define ${varMatch[1]} in your tokens.css @theme block`,
                });
              }
            }
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ violations, count: violations.length }, null, 2),
            },
          ],
        };
      }

      case "get_animation_state": {
        const selector = (args as { selector?: string }).selector;
        const states = deps.contextStore.getAnimationState(selector);
        return {
          content: [{ type: "text", text: JSON.stringify(states, null, 2) }],
        };
      }

      case "get_extracted_styles": {
        const selector = (args as { selector?: string }).selector;
        const styles = deps.contextStore.getExtractedStyles(selector);
        return {
          content: [{ type: "text", text: JSON.stringify(styles, null, 2) }],
        };
      }

      case "get_mutation_diffs": {
        const { tabId, format } = args as { tabId?: number; format?: string };
        const session = deps.contextStore.getSession(tabId ?? undefined);

        if (!session) {
          // Fall back to raw mutation diffs if no session data pushed yet
          const diffs = deps.contextStore.getMutations();
          if (diffs.length === 0) {
            return {
              content: [{ type: "text", text: "No active Flow session found. No changes accumulated." }],
            };
          }
          return {
            content: [{ type: "text", text: JSON.stringify(diffs, null, 2) }],
          };
        }

        if (format === "json") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    annotations: session.annotations,
                    textEdits: session.textEdits,
                    mutationDiffs: session.mutationDiffs,
                    designerChanges: session.designerChanges,
                    animationDiffs: session.animationDiffs,
                    promptSteps: session.promptSteps,
                  },
                  null,
                  2,
                ),
              },
            ],
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
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
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
