import { randomUUID } from "crypto";
import { signalStore } from "./signal-store";

export interface CaptureRequest {
  id: string;
  status: "pending" | "complete";
  previewUrl: string;
  dataUrl?: string;
  createdAt: number;
}

const CLEANUP_AGE_MS = 60_000;

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

  complete(id: string, dataUrl: string): void {
    const request = this.requests.get(id);
    if (!request) return;
    request.status = "complete";
    request.dataUrl = dataUrl;
  }

  get(id: string): CaptureRequest | undefined {
    return this.requests.get(id);
  }

  /** Remove completed requests older than 60s */
  private cleanup(): void {
    const now = Date.now();
    for (const [id, req] of this.requests) {
      if (req.status === "complete" && now - req.createdAt > CLEANUP_AGE_MS) {
        this.requests.delete(id);
      }
    }
  }
}

export const captureStore = new CaptureStore();
