import { randomUUID } from "crypto";
import { signalStore } from "./signal-store";

export interface CaptureRequest {
  id: string;
  status: "pending" | "complete" | "error";
  previewUrl: string;
  dataUrl?: string;
  error?: string;
  createdAt: number;
}

const CLEANUP_AGE_MS = 60_000;
const PENDING_MAX_AGE_MS = 120_000;

class CaptureStore {
  private requests = new Map<string, CaptureRequest>();

  create(previewUrl: string): CaptureRequest {
    this.cleanup();

    const request: CaptureRequest = {
      id: randomUUID(),
      status: "pending",
      previewUrl,
      createdAt: Date.now(),
    };

    this.requests.set(request.id, request);
    signalStore.captureRequest(request.previewUrl, request.id);
    return request;
  }

  complete(id: string, dataUrl: string): boolean {
    const request = this.requests.get(id);
    if (!request) return false;
    request.status = "complete";
    request.dataUrl = dataUrl;
    return true;
  }

  fail(id: string, error: string): boolean {
    const request = this.requests.get(id);
    if (!request) return false;
    request.status = "error";
    request.error = error;
    return true;
  }

  get(id: string): CaptureRequest | undefined {
    return this.requests.get(id);
  }

  /** Remove completed/error requests older than 60s, pending requests older than 120s */
  private cleanup(): void {
    const now = Date.now();
    for (const [id, req] of this.requests) {
      const age = now - req.createdAt;
      if (req.status !== "pending" && age > CLEANUP_AGE_MS) {
        this.requests.delete(id);
      } else if (req.status === "pending" && age > PENDING_MAX_AGE_MS) {
        this.requests.delete(id);
      }
    }
  }
}

export const captureStore = new CaptureStore();
