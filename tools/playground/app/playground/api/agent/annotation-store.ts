import { randomUUID } from "crypto";
import { signalStore } from "./signal-store";

export type AnnotationIntent = "fix" | "change" | "question";
export type AnnotationPriority = "P1" | "P2" | "P3" | "P4" | null;
export type AnnotationStatus = "pending" | "acknowledged" | "resolved" | "dismissed";

export interface PlaygroundAnnotation {
  id: string;
  componentId: string;
  intent: AnnotationIntent;
  priority: AnnotationPriority;
  status: AnnotationStatus;
  message: string;
  resolution?: string;
  resolvedBy?: "human" | "agent";
  tokenOverrides?: Record<string, string>;
  variant?: string;
  x?: number;          // percentage (0-100) of card render area width
  y?: number;          // percentage (0-100) of card render area height
  createdAt: number;
  resolvedAt?: number;
}

export interface AddAnnotationInput {
  componentId: string;
  intent: AnnotationIntent;
  priority?: AnnotationPriority;
  message: string;
  x?: number;
  y?: number;
}

class AnnotationStore {
  private annotations = new Map<string, PlaygroundAnnotation>();

  add(input: AddAnnotationInput): PlaygroundAnnotation {
    const annotation: PlaygroundAnnotation = {
      id: randomUUID(),
      componentId: input.componentId,
      intent: input.intent,
      priority: input.priority ?? null,
      status: "pending",
      message: input.message,
      x: input.x,
      y: input.y,
      createdAt: Date.now(),
    };

    this.annotations.set(annotation.id, annotation);
    signalStore.annotationsChanged(input.componentId);
    return annotation;
  }

  resolve(id: string, summary?: string): PlaygroundAnnotation {
    const annotation = this.findById(id);
    if (!annotation) throw new Error("Annotation not found");

    annotation.status = "resolved";
    annotation.resolution = summary;
    annotation.resolvedAt = Date.now();
    signalStore.annotationsChanged(annotation.componentId);
    return annotation;
  }

  dismiss(id: string, reason: string): PlaygroundAnnotation {
    const annotation = this.findById(id);
    if (!annotation) throw new Error("Annotation not found");

    annotation.status = "dismissed";
    annotation.resolution = reason;
    annotation.resolvedAt = Date.now();
    signalStore.annotationsChanged(annotation.componentId);
    return annotation;
  }

  getAll(): PlaygroundAnnotation[] {
    return [...this.annotations.values()];
  }

  getForComponent(componentId: string): PlaygroundAnnotation[] {
    return this.getAll().filter((a) => a.componentId === componentId);
  }

  getPending(componentId?: string): PlaygroundAnnotation[] {
    return this.getAll().filter(
      (a) =>
        (a.status === "pending" || a.status === "acknowledged") &&
        (!componentId || a.componentId === componentId),
    );
  }

  getByStatus(status: AnnotationStatus, componentId?: string): PlaygroundAnnotation[] {
    return this.getAll().filter(
      (a) =>
        a.status === status &&
        (!componentId || a.componentId === componentId),
    );
  }

  getById(id: string): PlaygroundAnnotation | undefined {
    return this.annotations.get(id);
  }

  /** Look up by exact ID or unique prefix (e.g. first 8 chars of UUID). */
  private findById(id: string): PlaygroundAnnotation | undefined {
    // Try exact match first
    const exact = this.annotations.get(id);
    if (exact) return exact;

    // Fall back to prefix match
    const matches = [...this.annotations.keys()].filter((k) => k.startsWith(id));
    if (matches.length === 1) return this.annotations.get(matches[0]);
    return undefined;
  }

  clearAll(): void {
    this.annotations.clear();
    signalStore.annotationsChanged();
  }
}

export const annotationStore = new AnnotationStore();
