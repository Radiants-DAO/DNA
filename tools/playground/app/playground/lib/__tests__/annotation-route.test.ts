import { beforeEach, describe, expect, it } from "vitest";
import { GET, POST } from "../../api/agent/annotation/route";
import { annotationStore } from "../../api/agent/annotation-store";

function makeRequest(url: string, body?: unknown): Request {
  if (body) {
    return new Request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  return new Request(url);
}

beforeEach(() => {
  annotationStore.clearAll();
});

describe("annotation API route", () => {
  describe("POST - annotate", () => {
    it("creates an annotation with defaults", async () => {
      const res = await POST(
        makeRequest("http://localhost/api/agent/annotation", {
          action: "annotate",
          componentId: "button",
          message: "Fix border radius",
        }),
      );
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.annotation.intent).toBe("change");
      expect(data.annotation.priority).toBeNull();
      expect(data.annotation.status).toBe("pending");
    });

    it("returns 400 when componentId is missing", async () => {
      const res = await POST(
        makeRequest("http://localhost/api/agent/annotation", {
          action: "annotate",
          message: "No component",
        }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when action is missing", async () => {
      const res = await POST(
        makeRequest("http://localhost/api/agent/annotation", {}),
      );
      expect(res.status).toBe(400);
    });
  });

  describe("POST - resolve/dismiss", () => {
    it("resolves an annotation", async () => {
      const a = annotationStore.add({
        componentId: "button",
        intent: "fix",
        priority: "P1",
        message: "Test",
      });

      const res = await POST(
        makeRequest("http://localhost/api/agent/annotation", {
          action: "resolve",
          id: a.id,
          summary: "Fixed it",
        }),
      );
      const data = await res.json();
      expect(data.annotation.status).toBe("resolved");
    });

    it("returns 404 for invalid id", async () => {
      const res = await POST(
        makeRequest("http://localhost/api/agent/annotation", {
          action: "resolve",
          id: "nonexistent",
        }),
      );
      expect(res.status).toBe(404);
    });

    it("dismisses with reason", async () => {
      const a = annotationStore.add({
        componentId: "card",
        intent: "question",
        priority: "P3",
        message: "Test",
      });

      const res = await POST(
        makeRequest("http://localhost/api/agent/annotation", {
          action: "dismiss",
          id: a.id,
          reason: "Not applicable",
        }),
      );
      const data = await res.json();
      expect(data.annotation.status).toBe("dismissed");
    });

    it("returns 400 for dismiss without reason", async () => {
      const a = annotationStore.add({
        componentId: "button",
        intent: "fix",
        severity: "blocking",
        message: "Test",
      });

      const res = await POST(
        makeRequest("http://localhost/api/agent/annotation", {
          action: "dismiss",
          id: a.id,
        }),
      );
      expect(res.status).toBe(400);
    });
  });

  describe("GET - filtering", () => {
    it("returns all annotations", async () => {
      annotationStore.add({ componentId: "button", intent: "fix", severity: "blocking", message: "A" });
      annotationStore.add({ componentId: "card", intent: "change", severity: "suggestion", message: "B" });

      const res = await GET(makeRequest("http://localhost/api/agent/annotation"));
      const data = await res.json();
      expect(data.annotations).toHaveLength(2);
    });

    it("filters by componentId", async () => {
      annotationStore.add({ componentId: "button", intent: "fix", severity: "blocking", message: "A" });
      annotationStore.add({ componentId: "card", intent: "change", severity: "suggestion", message: "B" });

      const res = await GET(makeRequest("http://localhost/api/agent/annotation?componentId=button"));
      const data = await res.json();
      expect(data.annotations).toHaveLength(1);
      expect(data.annotations[0].componentId).toBe("button");
    });

    it("filters by pending status", async () => {
      const a = annotationStore.add({ componentId: "button", intent: "fix", severity: "blocking", message: "A" });
      annotationStore.add({ componentId: "button", intent: "change", severity: "suggestion", message: "B" });
      annotationStore.resolve(a.id, "Done");

      const res = await GET(makeRequest("http://localhost/api/agent/annotation?status=pending"));
      const data = await res.json();
      expect(data.annotations).toHaveLength(1);
      expect(data.annotations[0].message).toBe("B");
    });

    it("filters by resolved status", async () => {
      const a = annotationStore.add({ componentId: "button", intent: "fix", severity: "blocking", message: "A" });
      annotationStore.add({ componentId: "button", intent: "change", severity: "suggestion", message: "B" });
      annotationStore.resolve(a.id, "Done");

      const res = await GET(makeRequest("http://localhost/api/agent/annotation?status=resolved"));
      const data = await res.json();
      expect(data.annotations).toHaveLength(1);
      expect(data.annotations[0].message).toBe("A");
      expect(data.annotations[0].status).toBe("resolved");
    });

    it("filters by dismissed status", async () => {
      const a = annotationStore.add({ componentId: "button", intent: "fix", severity: "blocking", message: "A" });
      annotationStore.add({ componentId: "button", intent: "change", severity: "suggestion", message: "B" });
      annotationStore.dismiss(a.id, "Not needed");

      const res = await GET(makeRequest("http://localhost/api/agent/annotation?status=dismissed"));
      const data = await res.json();
      expect(data.annotations).toHaveLength(1);
      expect(data.annotations[0].status).toBe("dismissed");
    });
  });

  describe("coordinates", () => {
    it("accepts x/y on annotate", async () => {
      const res = await POST(
        makeRequest("http://localhost/api/agent/annotation", {
          action: "annotate",
          componentId: "button",
          message: "This corner",
          x: 85.5,
          y: 12.3,
        }),
      );
      const data = await res.json();
      expect(data.annotation.x).toBe(85.5);
      expect(data.annotation.y).toBe(12.3);
    });

    it("ignores non-numeric x/y", async () => {
      const res = await POST(
        makeRequest("http://localhost/api/agent/annotation", {
          action: "annotate",
          componentId: "button",
          message: "Bad coords",
          x: "not-a-number",
          y: null,
        }),
      );
      const data = await res.json();
      expect(data.annotation.x).toBeUndefined();
      expect(data.annotation.y).toBeUndefined();
    });
  });

  describe("componentId normalization", () => {
    it("lowercases componentId on annotate", async () => {
      const res = await POST(
        makeRequest("http://localhost/api/agent/annotation", {
          action: "annotate",
          componentId: "Button",
          message: "Fix border",
        }),
      );
      const data = await res.json();
      expect(data.annotation.componentId).toBe("button");
    });

    it("matches normalized IDs in GET filter", async () => {
      await POST(
        makeRequest("http://localhost/api/agent/annotation", {
          action: "annotate",
          componentId: "Button",
          message: "Fix border",
        }),
      );

      const res = await GET(makeRequest("http://localhost/api/agent/annotation?componentId=button"));
      const data = await res.json();
      expect(data.annotations).toHaveLength(1);
    });
  });
});
