import { randomUUID } from "crypto";
import { signalStore } from "./signal-store";

export type AnnotationIntent = "fix" | "change" | "question" | "approve";
export type AnnotationSeverity = "blocking" | "important" | "suggestion";
export type AnnotationStatus = "pending" | "acknowledged" | "resolved" | "dismissed";

export interface PlaygroundAnnotation {
  id: string;
  componentId: string;
  intent: AnnotationIntent;
  severity: AnnotationSeverity;
  status: AnnotationStatus;
  message: string;
  resolution?: string;
  resolvedBy?: "human" | "agent";
  tokenOverrides?: Record<string, string>;
  variant?: string;
  createdAt: number;
  resolvedAt?: number;
}

export interface AddAnnotationInput {
  componentId: string;
  intent: AnnotationIntent;
  severity: AnnotationSeverity;
  message: string;
}

class AnnotationStore {
  private annotations = new Map<string, PlaygroundAnnotation>();

  add(input: AddAnnotationInput): PlaygroundAnnotation {
    const annotation: PlaygroundAnnotation = {
      id: randomUUID(),
      componentId: input.componentId,
      intent: input.intent,
      severity: input.severity,
      status: "pending",
      message: input.message,
      createdAt: Date.now(),
    };

    this.annotations.set(annotation.id, annotation);
    signalStore.annotationsChanged(input.componentId);
    return annotation;
  }

  resolve(id: string, summary?: string): PlaygroundAnnotation {
    const annotation = this.annotations.get(id);
    if (!annotation) throw new Error("Annotation not found");

    annotation.status = "resolved";
    annotation.resolution = summary;
    annotation.resolvedAt = Date.now();
    signalStore.annotationsChanged(annotation.componentId);
    return annotation;
  }

  dismiss(id: string, reason: string): PlaygroundAnnotation {
    const annotation = this.annotations.get(id);
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

  getById(id: string): PlaygroundAnnotation | undefined {
    return this.annotations.get(id);
  }

  clearAll(): void {
    this.annotations.clear();
    signalStore.annotationsChanged();
  }
}

export const annotationStore = new AnnotationStore();
