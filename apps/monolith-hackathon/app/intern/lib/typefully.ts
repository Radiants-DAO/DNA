// app/intern/lib/typefully.ts
import type {
  TypefullyDraft,
  TypefullyDraftsResponse,
  TypefullyTagsResponse,
  CreateDraftRequest,
  UpdateDraftRequest,
} from '../types/typefully';

const API_BASE = 'https://api.typefully.com/v2';

function getHeaders(): HeadersInit {
  const apiKey = process.env.TYPEFULLY_API_KEY;
  if (!apiKey) {
    throw new Error('TYPEFULLY_API_KEY is not set');
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

function getSocialSetId(): string {
  const id = process.env.TYPEFULLY_SOCIAL_SET_ID;
  if (!id) {
    throw new Error('TYPEFULLY_SOCIAL_SET_ID is not set');
  }
  return id;
}

// ============================================================================
// Read Operations
// ============================================================================

export async function listDrafts(limit = 50, offset = 0): Promise<TypefullyDraftsResponse> {
  const socialSetId = getSocialSetId();
  const url = `${API_BASE}/social-sets/${socialSetId}/drafts?limit=${limit}&offset=${offset}`;

  const res = await fetch(url, {
    headers: getHeaders(),
    next: { revalidate: 60 }, // Cache for 60 seconds
  });

  if (!res.ok) {
    throw new Error(`Typefully API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getDraft(draftId: number): Promise<TypefullyDraft> {
  const socialSetId = getSocialSetId();
  const url = `${API_BASE}/social-sets/${socialSetId}/drafts/${draftId}`;

  const res = await fetch(url, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Typefully API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function listTags(): Promise<TypefullyTagsResponse> {
  const socialSetId = getSocialSetId();
  const url = `${API_BASE}/social-sets/${socialSetId}/tags`;

  const res = await fetch(url, {
    headers: getHeaders(),
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!res.ok) {
    throw new Error(`Typefully API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ============================================================================
// Write Operations
// ============================================================================

export async function createDraft(data: CreateDraftRequest): Promise<TypefullyDraft> {
  const socialSetId = getSocialSetId();
  const url = `${API_BASE}/social-sets/${socialSetId}/drafts`;

  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(`Typefully API error: ${res.status} - ${JSON.stringify(error)}`);
  }

  return res.json();
}

export async function updateDraft(draftId: number, data: UpdateDraftRequest): Promise<TypefullyDraft> {
  const socialSetId = getSocialSetId();
  const url = `${API_BASE}/social-sets/${socialSetId}/drafts/${draftId}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(`Typefully API error: ${res.status} - ${JSON.stringify(error)}`);
  }

  return res.json();
}

export async function createTag(name: string): Promise<{ slug: string; name: string }> {
  const socialSetId = getSocialSetId();
  const url = `${API_BASE}/social-sets/${socialSetId}/tags`;

  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(`Typefully API error: ${res.status} - ${JSON.stringify(error)}`);
  }

  return res.json();
}
