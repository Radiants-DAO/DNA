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
import type { AgentFeedback } from "@flow/shared";

export interface McpDependencies {
  schemaResolver: SchemaResolver;
  tokenParser: TokenParser;
  sourceMapService: SourceMapService;
  contextStore: ContextStore;
  broadcast: (message: { type: string; payload: unknown }) => void;
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
  ...PaginationFields,
});

const GetSessionContextInput = z.object({
  tabId: z.number().optional(),
  format: z.enum(["markdown", "json"]).optional(),
});

const SessionFieldInput = z.object({
  tabId: z.number().optional(),
  ...PaginationFields,
});

const PostFeedbackInput = z.object({
  tabId: z.number(),
  selector: z.string().min(1),
  content: z.string().min(1),
  intent: z.enum(["comment", "question", "fix", "approve"]).default("comment"),
  severity: z.enum(["blocking", "important", "suggestion"]).default("suggestion"),
  componentName: z.string().optional(),
  sourceFile: z.string().optional(),
  sourceLine: z.number().optional(),
});

const ResolveFeedbackInput = z.object({
  tabId: z.number(),
  id: z.string().min(1),
  summary: z.string().min(1),
});

const ReplyToThreadInput = z.object({
  tabId: z.number(),
  id: z.string().min(1),
  content: z.string().min(1),
});

const GetPendingFeedbackInput = z.object({
  tabId: z.number(),
  ...PaginationFields,
});

// ---------- Shared annotations (all tools are read-only) ----------

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const WRITE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const;

const RESOLVE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const;

const GENERIC_OBJECT_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: true,
} as const;

const PAGINATED_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    items: { type: "array", items: {} },
    total: { type: "number" },
    offset: { type: "number" },
    limit: { type: "number" },
    has_more: { type: "boolean" },
  },
  required: ["items", "total", "offset", "limit", "has_more"],
  additionalProperties: true,
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
    outputSchema: GENERIC_OBJECT_OUTPUT_SCHEMA,
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
    outputSchema: PAGINATED_OUTPUT_SCHEMA,
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
    outputSchema: GENERIC_OBJECT_OUTPUT_SCHEMA,
  },
  {
    name: "flow_get_design_audit",
    description:
      "Audit the project for DNA violations: hardcoded colors, missing tokens, non-semantic token usage, motion violations. Each violation includes file:line and a suggested fix.",
    inputSchema: { type: "object" as const, properties: {} },
    annotations: READ_ONLY_ANNOTATIONS,
    outputSchema: {
      type: "object",
      properties: {
        violations: { type: "array", items: {} },
        count: { type: "number" },
      },
      required: ["violations", "count"],
      additionalProperties: true,
    },
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
    outputSchema: PAGINATED_OUTPUT_SCHEMA,
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
    outputSchema: PAGINATED_OUTPUT_SCHEMA,
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
        ...PAGINATION_PROPERTIES,
      },
    },
    annotations: READ_ONLY_ANNOTATIONS,
    outputSchema: GENERIC_OBJECT_OUTPUT_SCHEMA,
  },
  {
    name: "flow_get_session_context",
    description:
      "Get the full compiled prompt from the current Flow session — includes all design changes, text edits, comments, and instructions in structured markdown. This is the same output the user sees when they click 'Copy Prompt' in the panel.",
    inputSchema: {
      type: "object" as const,
      properties: {
        tabId: {
          type: "number",
          description:
            "Browser tab ID. Omit for the most recently active tab.",
        },
        format: {
          type: "string",
          enum: ["markdown", "json"],
          description:
            "Output format. 'markdown' returns the compiled prompt. 'json' returns raw session data arrays. Default: markdown.",
        },
      },
    },
    annotations: READ_ONLY_ANNOTATIONS,
    outputSchema: GENERIC_OBJECT_OUTPUT_SCHEMA,
  },
  {
    name: "flow_get_comments",
    description:
      "Get all comments and questions from the current Flow session. Comments are user feedback attached to specific UI elements.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ...PAGINATION_PROPERTIES,
        tabId: {
          type: "number",
          description:
            "Browser tab ID. Omit for the most recently active tab.",
        },
      },
    },
    annotations: READ_ONLY_ANNOTATIONS,
    outputSchema: PAGINATED_OUTPUT_SCHEMA,
  },
  {
    name: "flow_get_text_edits",
    description:
      "Get all text edits from the current Flow session, showing before/after text changes on elements.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ...PAGINATION_PROPERTIES,
        tabId: {
          type: "number",
          description:
            "Browser tab ID. Omit for the most recently active tab.",
        },
      },
    },
    annotations: READ_ONLY_ANNOTATIONS,
    outputSchema: PAGINATED_OUTPUT_SCHEMA,
  },
  {
    name: "flow_get_design_changes",
    description:
      "Get all style mutations from design tools in the current Flow session.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ...PAGINATION_PROPERTIES,
        tabId: {
          type: "number",
          description:
            "Browser tab ID. Omit for the most recently active tab.",
        },
      },
    },
    annotations: READ_ONLY_ANNOTATIONS,
    outputSchema: PAGINATED_OUTPUT_SCHEMA,
  },
  {
    name: "flow_post_feedback",
    description:
      "Post structured feedback on a UI element. The feedback appears as a badge on the element in the browser and in the Flow panel. Use intent to classify: 'comment' for general notes, 'question' for clarification needs, 'fix' for issues found, 'approve' for sign-off.",
    inputSchema: {
      type: "object" as const,
      properties: {
        tabId: { type: "number", description: "Browser tab ID for scoping feedback." },
        selector: { type: "string", description: "CSS selector of the target element" },
        content: { type: "string", description: "Feedback text" },
        intent: { type: "string", enum: ["comment", "question", "fix", "approve"], description: "Feedback type. Default: comment." },
        severity: { type: "string", enum: ["blocking", "important", "suggestion"], description: "How urgent. Default: suggestion." },
        componentName: { type: "string", description: "React component name (if known)" },
        sourceFile: { type: "string", description: "Source file path (if known)" },
        sourceLine: { type: "number", description: "Line number in source (if known)" },
      },
      required: ["tabId", "selector", "content"],
    },
    annotations: WRITE_ANNOTATIONS,
    outputSchema: GENERIC_OBJECT_OUTPUT_SCHEMA,
  },
  {
    name: "flow_resolve_annotation",
    description:
      "Mark an annotation or feedback item as resolved. Provide a summary of how it was addressed.",
    inputSchema: {
      type: "object" as const,
      properties: {
        tabId: { type: "number", description: "Browser tab ID for scoping feedback." },
        id: { type: "string", description: "The annotation/feedback ID to resolve" },
        summary: { type: "string", description: "Brief summary of how the issue was resolved" },
      },
      required: ["tabId", "id", "summary"],
    },
    annotations: RESOLVE_ANNOTATIONS,
    outputSchema: GENERIC_OBJECT_OUTPUT_SCHEMA,
  },
  {
    name: "flow_reply_to_thread",
    description:
      "Reply to an existing feedback thread on a UI element. Creates a threaded conversation between agent and human.",
    inputSchema: {
      type: "object" as const,
      properties: {
        tabId: { type: "number", description: "Browser tab ID for scoping feedback." },
        id: { type: "string", description: "The feedback ID to reply to" },
        content: { type: "string", description: "Reply text" },
      },
      required: ["tabId", "id", "content"],
    },
    annotations: WRITE_ANNOTATIONS,
    outputSchema: GENERIC_OBJECT_OUTPUT_SCHEMA,
  },
  {
    name: "flow_get_pending_feedback",
    description:
      "Get all unresolved feedback items (both human comments/questions and agent feedback) that still need attention.",
    inputSchema: {
      type: "object" as const,
      properties: {
        tabId: { type: "number", description: "Browser tab ID to scope pending feedback." },
        ...PAGINATION_PROPERTIES,
      },
      required: ["tabId"],
    },
    annotations: READ_ONLY_ANNOTATIONS,
    outputSchema: PAGINATED_OUTPUT_SCHEMA,
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

function sessionFieldResponse(
  contextStore: ContextStore,
  args: unknown,
  field: keyof import("../services/context-store.js").SessionData,
  emptyMessage: string,
  toolName: string,
) {
  let parsed: z.infer<typeof SessionFieldInput>;
  try {
    parsed = SessionFieldInput.parse(args ?? {});
  } catch (err) {
    return zodError(err as z.ZodError, toolName);
  }

  const session = contextStore.getSession(parsed.tabId ?? undefined);
  if (!session) {
    return {
      content: [
        {
          type: "text" as const,
          text: "No active Flow session. Use flow_get_component_tree to verify the extension is connected.",
        },
      ],
      isError: true,
    };
  }
  const data = session[field];
  if (Array.isArray(data) && data.length === 0) {
    const empty = { items: [], total: 0, offset: parsed.offset, limit: parsed.limit, has_more: false };
    return {
      content: [{ type: "text" as const, text: emptyMessage }],
      structuredContent: empty,
    };
  }
  if (Array.isArray(data)) {
    const result = paginate(data, parsed.offset, parsed.limit);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  }
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
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
          parsed = GetElementContextInput.parse(args ?? {});
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
          parsed = GetComponentTreeInput.parse(args ?? {});
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
          parsed = GetPageTokensInput.parse(args ?? {});
        } catch (err) {
          return zodError(err as z.ZodError, name);
        }

        const index = deps.tokenParser.getIndex();
        const allTokens = index.all;
        const paged = paginate(allTokens, parsed.offset, parsed.limit);
        const pagedBrand = paginate(index.byTier.brand, parsed.offset, parsed.limit);
        const pagedSemantic = paginate(index.byTier.semantic, parsed.offset, parsed.limit);
        const result = {
          ...paged,
          brand: pagedBrand.items,
          semantic: pagedSemantic.items,
          brand_total: pagedBrand.total,
          semantic_total: pagedSemantic.total,
          brand_has_more: pagedBrand.has_more,
          semantic_has_more: pagedSemantic.has_more,
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
          GetDesignAuditInput.parse(args ?? {});
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
                  suggestion: `Use a token reference like var(--color-page) instead of ${value}`,
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
          parsed = GetAnimationStateInput.parse(args ?? {});
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
          parsed = GetExtractedStylesInput.parse(args ?? {});
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
          parsed = GetMutationDiffsInput.parse(args ?? {});
        } catch (err) {
          return zodError(err as z.ZodError, name);
        }

        const { tabId, format, offset, limit } = parsed;
        const session = deps.contextStore.getSession(tabId ?? undefined);

        if (!session) {
          const diffs = deps.contextStore.getMutations();
          if (diffs.length === 0) {
            const message =
              "No active Flow session found and no changes accumulated. Open a page in Chrome with the Flow extension active, make some visual changes, then try again.";
            return {
              content: [
                {
                  type: "text",
                  text: message,
                },
              ],
              structuredContent: { message },
            };
          }
          const pagedDiffs = paginate(diffs, offset, limit);
          return {
            content: [{ type: "text", text: JSON.stringify(pagedDiffs, null, 2) }],
            structuredContent: pagedDiffs,
          };
        }

        if (format === "json") {
          const result = {
            textEdits: paginate(session.textEdits, offset, limit),
            mutationDiffs: paginate(session.mutationDiffs, offset, limit),
            animationDiffs: paginate(session.animationDiffs, offset, limit),
            comments: paginate(session.comments, offset, limit),
            promptSteps: paginate(session.promptSteps, offset, limit),
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
          structuredContent: {
            markdown: session.compiledMarkdown || "No changes accumulated in this session yet.",
          },
        };
      }

      case "flow_get_session_context": {
        let parsed: z.infer<typeof GetSessionContextInput>;
        try {
          parsed = GetSessionContextInput.parse(args ?? {});
        } catch (err) {
          return zodError(err as z.ZodError, name);
        }

        const session = deps.contextStore.getSession(parsed.tabId ?? undefined);

        if (!session) {
          return {
            content: [
              {
                type: "text",
                text: "No active Flow session. Open the Flow DevTools panel and make some edits first. Use flow_get_component_tree to verify the extension is connected.",
              },
            ],
            isError: true,
          };
        }

        if (parsed.format === "json") {
          const data = {
            textEdits: session.textEdits,
            mutationDiffs: session.mutationDiffs,
            animationDiffs: session.animationDiffs,
            promptSteps: session.promptSteps,
            comments: session.comments,
            lastUpdated: session.lastUpdated,
          };
          return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
            structuredContent: data,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: session.compiledMarkdown || "Session active but no changes accumulated yet.",
            },
          ],
        };
      }

      case "flow_get_comments":
        return sessionFieldResponse(deps.contextStore, args, "comments", "No comments in this session.", name);

      case "flow_get_text_edits":
        return sessionFieldResponse(deps.contextStore, args, "textEdits", "No text edits in this session.", name);

      case "flow_get_design_changes":
        return sessionFieldResponse(deps.contextStore, args, "mutationDiffs", "No style mutations in this session.", name);

      case "flow_post_feedback": {
        let parsed: z.infer<typeof PostFeedbackInput>;
        try {
          parsed = PostFeedbackInput.parse(args ?? {});
        } catch (err) {
          return zodError(err as z.ZodError, name);
        }

        const feedback: AgentFeedback = {
          id: crypto.randomUUID(),
          tabId: parsed.tabId,
          role: 'agent',
          intent: parsed.intent,
          severity: parsed.severity,
          status: 'pending',
          selector: parsed.selector,
          componentName: parsed.componentName,
          sourceFile: parsed.sourceFile,
          sourceLine: parsed.sourceLine,
          content: parsed.content,
          thread: [],
          timestamp: Date.now(),
        };

        deps.contextStore.addAgentFeedback(parsed.tabId, feedback);
        deps.broadcast({ type: 'agent-feedback', payload: feedback });

        const postResult = { success: true, id: feedback.id, message: "Feedback posted and sent to extension." };
        return {
          content: [{ type: "text", text: JSON.stringify(postResult, null, 2) }],
          structuredContent: postResult,
        };
      }

      case "flow_resolve_annotation": {
        let parsed: z.infer<typeof ResolveFeedbackInput>;
        try {
          parsed = ResolveFeedbackInput.parse(args ?? {});
        } catch (err) {
          return zodError(err as z.ZodError, name);
        }

        const resolved = deps.contextStore.resolveAgentFeedback(parsed.tabId, parsed.id, parsed.summary);
        if (!resolved) {
          return {
            content: [{ type: "text", text: `No feedback found with id "${parsed.id}" in tab ${parsed.tabId}. Use flow_get_pending_feedback to list current feedback items.` }],
            isError: true,
          };
        }

        deps.broadcast({ type: 'agent-resolve', payload: { tabId: parsed.tabId, targetId: parsed.id, summary: parsed.summary, timestamp: Date.now() } });

        const resolveResult = { success: true, id: parsed.id, status: "resolved" };
        return {
          content: [{ type: "text", text: JSON.stringify(resolveResult, null, 2) }],
          structuredContent: resolveResult,
        };
      }

      case "flow_reply_to_thread": {
        let parsed: z.infer<typeof ReplyToThreadInput>;
        try {
          parsed = ReplyToThreadInput.parse(args ?? {});
        } catch (err) {
          return zodError(err as z.ZodError, name);
        }

        const updated = deps.contextStore.addThreadReply(parsed.tabId, parsed.id, { role: 'agent', content: parsed.content });
        if (!updated) {
          return {
            content: [{ type: "text", text: `No feedback found with id "${parsed.id}" in tab ${parsed.tabId}. Use flow_get_pending_feedback to list current feedback items.` }],
            isError: true,
          };
        }

        const reply = updated.thread[updated.thread.length - 1];
        deps.broadcast({ type: 'agent-thread-reply', payload: { tabId: parsed.tabId, targetId: parsed.id, message: reply } });

        const replyResult = { success: true, id: parsed.id, threadLength: updated.thread.length };
        return {
          content: [{ type: "text", text: JSON.stringify(replyResult, null, 2) }],
          structuredContent: replyResult,
        };
      }

      case "flow_get_pending_feedback": {
        let parsed: z.infer<typeof GetPendingFeedbackInput>;
        try {
          parsed = GetPendingFeedbackInput.parse(args ?? {});
        } catch (err) {
          return zodError(err as z.ZodError, name);
        }

        const agentPending = deps.contextStore.getPendingAgentFeedback(parsed.tabId);
        const feedbackSession = deps.contextStore.getSession(parsed.tabId);
        const humanComments = feedbackSession?.comments ?? [];
        const allPending = [...agentPending, ...humanComments];
        const pendingResult = paginate(allPending, parsed.offset, parsed.limit);

        return {
          content: [{ type: "text", text: JSON.stringify(pendingResult, null, 2) }],
          structuredContent: pendingResult,
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
