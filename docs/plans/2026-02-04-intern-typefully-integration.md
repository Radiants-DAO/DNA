# Intern Dashboard Typefully Integration Plan

**Status:** Implemented

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform /intern from a hardcoded dashboard into a two-tier Typefully-powered content management system with reviewer and editor views.

**Architecture:** Next.js API routes proxy Typefully API (key stays server-side). Two-tier auth determines view: reviewers see clean calendar + embedded tweets, editors see tasks + create/reschedule controls. Tasks stored in Typefully's `scratchpad_text` field with `[ ]`/`[x]` checkbox format.

**Tech Stack:** Next.js 16 App Router, Typefully API v2, react-tweet for embeds, Tailwind/existing CRT theme

---

## Phase 1: API Foundation

### Task 1: Install Dependencies

**Files:**
- Modify: `apps/monolith-hackathon/package.json`

**Step 1: Install react-tweet for embedded tweets**

```bash
cd apps/monolith-hackathon && pnpm add react-tweet
```

**Step 2: Verify installation**

```bash
pnpm list react-tweet
```
Expected: `react-tweet` appears in output

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add react-tweet for embedded tweets"
```

---

### Task 2: Typefully Types

**Files:**
- Create: `app/intern/types/typefully.ts`

**Step 1: Create Typefully API types**

```typescript
// app/intern/types/typefully.ts

// ============================================================================
// Typefully API Response Types
// ============================================================================

export type DraftStatus = 'draft' | 'scheduled' | 'published' | 'publishing' | 'error';

export interface TypefullyDraft {
  id: number;
  social_set_id: number;
  status: DraftStatus;
  created_at: string;
  updated_at: string | null;
  scheduled_date: string | null;
  published_at: string | null;
  draft_title: string | null;
  preview: string;
  tags: string[];
  share_url: string | null;
  private_url: string;
  x_published_url: string | null;
  x_post_published_at: string | null;
  scratchpad_text: string | null;
}

export interface TypefullyDraftsResponse {
  results: TypefullyDraft[];
  count: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

export interface TypefullyTag {
  slug: string;
  name: string;
  created_at: string;
}

export interface TypefullyTagsResponse {
  results: TypefullyTag[];
  count: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

// ============================================================================
// Draft Create/Update Request Types
// ============================================================================

export interface CreateDraftRequest {
  platforms: {
    x: {
      enabled: true;
      posts: { text: string; media_ids?: string[] }[];
      settings?: Record<string, unknown>;
    };
  };
  draft_title?: string;
  scratchpad_text?: string;
  tags?: string[];
  publish_at?: string; // ISO datetime or "now" or "next-free-slot"
}

export interface UpdateDraftRequest {
  draft_title?: string;
  scratchpad_text?: string;
  tags?: string[];
  publish_at?: string;
}

// ============================================================================
// Dashboard Types (transformed from Typefully)
// ============================================================================

export interface Task {
  id: string;
  text: string;
  assignee: string | null; // parsed from @mention
  completed: boolean;
}

export interface DashboardDraft {
  id: number;
  title: string;
  preview: string;
  status: DraftStatus;
  scheduledDate: string | null; // YYYY-MM-DD
  scheduledTime: string | null; // HH:MM
  publishedAt: string | null;
  publishedUrl: string | null;
  editUrl: string;
  tasks: Task[];
  tags: string[];
}

export type UserRole = 'reviewer' | 'editor';

// ============================================================================
// Assignee Colors
// ============================================================================

export const ASSIGNEE_COLORS: Record<string, string> = {
  rizzy: '#14f1b2',   // green
  kemo: '#6939ca',    // ultraviolet
  cronus: '#fd8f3a',  // amber
};

export const DEFAULT_TASK_TEMPLATE = `[ ] Create content @rizzy
[ ] Review @kemo`;
```

**Step 2: Commit**

```bash
git add app/intern/types/typefully.ts
git commit -m "feat(intern): add Typefully API and dashboard types"
```

---

### Task 3: Environment Variables

**Files:**
- Modify: `.env.local` (create if needed)
- Modify: `.env.example` (create if needed)

**Step 1: Create .env.example with required variables**

```bash
# apps/monolith-hackathon/.env.example
# Typefully API (server-only)
TYPEFULLY_API_KEY=your_api_key_here
TYPEFULLY_SOCIAL_SET_ID=your_social_set_id_here

# Auth passwords
NEXT_PUBLIC_INTERN_REVIEWER_PASSWORD=reviewer_password_here
INTERN_EDITOR_PASSWORD=editor_password_here
```

**Step 2: Add to .env.local with real values**

User must manually add their Typefully API key and social set ID.

**Step 3: Commit example file**

```bash
git add .env.example
git commit -m "chore: add env example for Typefully integration"
```

---

### Task 4: Typefully API Client

**Files:**
- Create: `app/intern/lib/typefully.ts`

**Step 1: Create server-side Typefully client**

```typescript
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
```

**Step 2: Commit**

```bash
git add app/intern/lib/typefully.ts
git commit -m "feat(intern): add Typefully API client"
```

---

### Task 5: Task Parser Utility

**Files:**
- Create: `app/intern/lib/tasks.ts`

**Step 1: Create task parser for scratchpad_text**

```typescript
// app/intern/lib/tasks.ts
import type { Task } from '../types/typefully';

/**
 * Parse tasks from Typefully scratchpad_text
 * Format: "[ ] Task text @assignee" or "[x] Completed task @assignee"
 */
export function parseTasks(scratchpadText: string | null): Task[] {
  if (!scratchpadText) return [];

  const lines = scratchpadText.split('\n');
  const tasks: Task[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Match checkbox pattern: [ ] or [x] or [X]
    const match = trimmed.match(/^\[([ xX])\]\s*(.+)$/);
    if (!match) continue;

    const completed = match[1].toLowerCase() === 'x';
    const content = match[2];

    // Extract @mention for assignee
    const assigneeMatch = content.match(/@(\w+)/);
    const assignee = assigneeMatch ? assigneeMatch[1].toLowerCase() : null;

    // Remove @mention from text for cleaner display
    const text = content.replace(/@\w+/g, '').trim();

    tasks.push({
      id: `task-${tasks.length}`,
      text,
      assignee,
      completed,
    });
  }

  return tasks;
}

/**
 * Serialize tasks back to scratchpad_text format
 */
export function serializeTasks(tasks: Task[]): string {
  return tasks
    .map((task) => {
      const checkbox = task.completed ? '[x]' : '[ ]';
      const assignee = task.assignee ? ` @${task.assignee}` : '';
      return `${checkbox} ${task.text}${assignee}`;
    })
    .join('\n');
}

/**
 * Toggle a task's completion status
 */
export function toggleTask(scratchpadText: string | null, taskIndex: number): string {
  const tasks = parseTasks(scratchpadText);
  if (taskIndex >= 0 && taskIndex < tasks.length) {
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
  }
  return serializeTasks(tasks);
}

/**
 * Add a new task to the scratchpad
 */
export function addTask(
  scratchpadText: string | null,
  text: string,
  assignee?: string
): string {
  const existing = scratchpadText?.trim() || '';
  const newTask = `[ ] ${text}${assignee ? ` @${assignee}` : ''}`;
  return existing ? `${existing}\n${newTask}` : newTask;
}
```

**Step 2: Commit**

```bash
git add app/intern/lib/tasks.ts
git commit -m "feat(intern): add task parser for scratchpad_text"
```

---

### Task 6: Draft Transformer Utility

**Files:**
- Create: `app/intern/lib/transforms.ts`

**Step 1: Create transformer from Typefully to Dashboard types**

```typescript
// app/intern/lib/transforms.ts
import type { TypefullyDraft, DashboardDraft } from '../types/typefully';
import { parseTasks } from './tasks';

/**
 * Transform Typefully draft to dashboard-friendly format
 */
export function transformDraft(draft: TypefullyDraft): DashboardDraft {
  // Parse scheduled date and time
  let scheduledDate: string | null = null;
  let scheduledTime: string | null = null;

  if (draft.scheduled_date) {
    const date = new Date(draft.scheduled_date);
    scheduledDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    scheduledTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    });
  }

  return {
    id: draft.id,
    title: draft.draft_title || 'Untitled Draft',
    preview: draft.preview || '',
    status: draft.status,
    scheduledDate,
    scheduledTime,
    publishedAt: draft.published_at,
    publishedUrl: draft.x_published_url,
    editUrl: draft.private_url,
    tasks: parseTasks(draft.scratchpad_text),
    tags: draft.tags || [],
  };
}

/**
 * Group drafts by scheduled date
 */
export function groupDraftsByDate(
  drafts: DashboardDraft[]
): Map<string, DashboardDraft[]> {
  const grouped = new Map<string, DashboardDraft[]>();

  for (const draft of drafts) {
    const key = draft.scheduledDate || 'unscheduled';
    const existing = grouped.get(key) || [];
    existing.push(draft);
    grouped.set(key, existing);
  }

  // Sort drafts within each day by time
  for (const [, dayDrafts] of grouped) {
    dayDrafts.sort((a, b) => {
      if (!a.scheduledTime) return 1;
      if (!b.scheduledTime) return -1;
      return a.scheduledTime.localeCompare(b.scheduledTime);
    });
  }

  return grouped;
}

/**
 * Extract tweet ID from X published URL
 * URL format: https://x.com/username/status/1234567890
 */
export function extractTweetId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Get unique assignees from drafts (for filtering)
 */
export function getUniqueAssignees(drafts: DashboardDraft[]): string[] {
  const assignees = new Set<string>();
  for (const draft of drafts) {
    for (const task of draft.tasks) {
      if (task.assignee) {
        assignees.add(task.assignee);
      }
    }
  }
  return Array.from(assignees).sort();
}
```

**Step 2: Commit**

```bash
git add app/intern/lib/transforms.ts
git commit -m "feat(intern): add draft transformer utilities"
```

---

## Phase 2: API Routes

### Task 7: List Drafts API Route

**Files:**
- Create: `app/api/typefully/drafts/route.ts`

**Step 1: Create GET endpoint for listing drafts**

```typescript
// app/api/typefully/drafts/route.ts
import { NextResponse } from 'next/server';
import { listDrafts } from '@/app/intern/lib/typefully';
import { transformDraft } from '@/app/intern/lib/transforms';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const response = await listDrafts(limit, offset);

    const drafts = response.results.map(transformDraft);

    return NextResponse.json({
      drafts,
      count: response.count,
      limit: response.limit,
      offset: response.offset,
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify the route works**

```bash
# Start dev server
pnpm dev

# In another terminal, test the endpoint (will fail without API key)
curl http://localhost:3000/api/typefully/drafts
```

Expected: Returns drafts array or 500 error if no API key

**Step 3: Commit**

```bash
git add app/api/typefully/drafts/route.ts
git commit -m "feat(api): add GET /api/typefully/drafts endpoint"
```

---

### Task 8: Create Draft API Route

**Files:**
- Modify: `app/api/typefully/drafts/route.ts`

**Step 1: Add POST handler with editor auth check**

```typescript
// app/api/typefully/drafts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { listDrafts, createDraft } from '@/app/intern/lib/typefully';
import { transformDraft } from '@/app/intern/lib/transforms';
import { DEFAULT_TASK_TEMPLATE } from '@/app/intern/types/typefully';

const EDITOR_PASSWORD = process.env.INTERN_EDITOR_PASSWORD;

function isEditor(request: NextRequest): boolean {
  const authHeader = request.headers.get('x-intern-auth');
  return authHeader === EDITOR_PASSWORD;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const response = await listDrafts(limit, offset);
    const drafts = response.results.map(transformDraft);

    return NextResponse.json({
      drafts,
      count: response.count,
      limit: response.limit,
      offset: response.offset,
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check editor auth
  if (!isEditor(request)) {
    return NextResponse.json(
      { error: 'Editor access required' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { title, brief, scheduledDate, tags } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Build the draft request
    const draftRequest = {
      platforms: {
        x: {
          enabled: true as const,
          posts: [{ text: brief || title }],
        },
      },
      draft_title: title,
      scratchpad_text: DEFAULT_TASK_TEMPLATE,
      tags: tags || [],
      publish_at: scheduledDate ? `${scheduledDate}T18:00:00Z` : undefined,
    };

    const created = await createDraft(draftRequest);
    const transformed = transformDraft(created);

    return NextResponse.json(transformed, { status: 201 });
  } catch (error) {
    console.error('Error creating draft:', error);
    return NextResponse.json(
      { error: 'Failed to create draft' },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/typefully/drafts/route.ts
git commit -m "feat(api): add POST /api/typefully/drafts for stub creation"
```

---

### Task 9: Update Draft API Route

**Files:**
- Create: `app/api/typefully/drafts/[id]/route.ts`

**Step 1: Create PATCH endpoint for updates**

```typescript
// app/api/typefully/drafts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDraft, updateDraft } from '@/app/intern/lib/typefully';
import { transformDraft } from '@/app/intern/lib/transforms';
import { toggleTask } from '@/app/intern/lib/tasks';

const EDITOR_PASSWORD = process.env.INTERN_EDITOR_PASSWORD;

function isEditor(request: NextRequest): boolean {
  const authHeader = request.headers.get('x-intern-auth');
  return authHeader === EDITOR_PASSWORD;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const draftId = parseInt(id, 10);

    if (isNaN(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });
    }

    const draft = await getDraft(draftId);
    const transformed = transformDraft(draft);

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check editor auth
  if (!isEditor(request)) {
    return NextResponse.json(
      { error: 'Editor access required' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const draftId = parseInt(id, 10);

    if (isNaN(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });
    }

    const body = await request.json();
    const { action, taskIndex, scheduledDate, scratchpad_text } = body;

    // Handle task toggle action
    if (action === 'toggle_task' && typeof taskIndex === 'number') {
      const currentDraft = await getDraft(draftId);
      const newScratchpad = toggleTask(currentDraft.scratchpad_text, taskIndex);

      const updated = await updateDraft(draftId, {
        scratchpad_text: newScratchpad,
      });

      return NextResponse.json(transformDraft(updated));
    }

    // Handle reschedule action
    if (scheduledDate) {
      const updated = await updateDraft(draftId, {
        publish_at: `${scheduledDate}T18:00:00Z`,
      });

      return NextResponse.json(transformDraft(updated));
    }

    // Handle direct scratchpad update
    if (scratchpad_text !== undefined) {
      const updated = await updateDraft(draftId, {
        scratchpad_text,
      });

      return NextResponse.json(transformDraft(updated));
    }

    return NextResponse.json(
      { error: 'No valid update action provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating draft:', error);
    return NextResponse.json(
      { error: 'Failed to update draft' },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/typefully/drafts/[id]/route.ts
git commit -m "feat(api): add GET/PATCH /api/typefully/drafts/[id] endpoint"
```

---

### Task 10: Tags API Route

**Files:**
- Create: `app/api/typefully/tags/route.ts`

**Step 1: Create tags endpoint**

```typescript
// app/api/typefully/tags/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { listTags, createTag } from '@/app/intern/lib/typefully';

const EDITOR_PASSWORD = process.env.INTERN_EDITOR_PASSWORD;

function isEditor(request: NextRequest): boolean {
  const authHeader = request.headers.get('x-intern-auth');
  return authHeader === EDITOR_PASSWORD;
}

export async function GET() {
  try {
    const response = await listTags();
    return NextResponse.json(response.results);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isEditor(request)) {
    return NextResponse.json(
      { error: 'Editor access required' },
      { status: 401 }
    );
  }

  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    const tag = await createTag(name);
    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/typefully/tags/route.ts
git commit -m "feat(api): add /api/typefully/tags endpoint"
```

---

## Phase 3: Two-Tier Authentication

### Task 11: Auth Context

**Files:**
- Create: `app/intern/context/AuthContext.tsx`

**Step 1: Create auth context with role support**

```typescript
// app/intern/context/AuthContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { UserRole } from '../types/typefully';

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  editorPassword: string | null; // For API calls
}

interface AuthContextValue extends AuthState {
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'intern-auth-v2';
const REVIEWER_PASSWORD = process.env.NEXT_PUBLIC_INTERN_REVIEWER_PASSWORD || 'reviewer2026';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    editorPassword: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check stored auth on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState({
          isAuthenticated: true,
          role: parsed.role,
          editorPassword: parsed.editorPassword || null,
        });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    // Check reviewer password (client-side)
    if (password === REVIEWER_PASSWORD) {
      const newState = {
        isAuthenticated: true,
        role: 'reviewer' as UserRole,
        editorPassword: null,
      };
      setState(newState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ role: 'reviewer' }));
      return true;
    }

    // Check editor password (server-side validation)
    try {
      const res = await fetch('/api/typefully/drafts', {
        headers: { 'x-intern-auth': password },
      });

      if (res.ok) {
        const newState = {
          isAuthenticated: true,
          role: 'editor' as UserRole,
          editorPassword: password,
        };
        setState(newState);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ role: 'editor', editorPassword: password })
        );
        return true;
      }
    } catch {
      // Fall through to return false
    }

    return false;
  }, []);

  const logout = useCallback(() => {
    setState({
      isAuthenticated: false,
      role: null,
      editorPassword: null,
    });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**Step 2: Commit**

```bash
git add app/intern/context/AuthContext.tsx
git commit -m "feat(intern): add two-tier auth context"
```

---

### Task 12: Drafts Data Hook

**Files:**
- Create: `app/intern/hooks/useDrafts.ts`

**Step 1: Create hook for fetching and managing drafts**

```typescript
// app/intern/hooks/useDrafts.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DashboardDraft } from '../types/typefully';
import { useAuth } from '../context/AuthContext';

interface UseDraftsReturn {
  drafts: DashboardDraft[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createStub: (data: CreateStubData) => Promise<DashboardDraft | null>;
  toggleTask: (draftId: number, taskIndex: number) => Promise<void>;
  reschedule: (draftId: number, newDate: string) => Promise<void>;
}

interface CreateStubData {
  title: string;
  brief?: string;
  scheduledDate?: string;
  tags?: string[];
}

export function useDrafts(): UseDraftsReturn {
  const { editorPassword } = useAuth();
  const [drafts, setDrafts] = useState<DashboardDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback((): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (editorPassword) {
      headers['x-intern-auth'] = editorPassword;
    }
    return headers;
  }, [editorPassword]);

  const fetchDrafts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch('/api/typefully/drafts');
      if (!res.ok) {
        throw new Error('Failed to fetch drafts');
      }

      const data = await res.json();
      setDrafts(data.drafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const createStub = useCallback(
    async (data: CreateStubData): Promise<DashboardDraft | null> => {
      try {
        const res = await fetch('/api/typefully/drafts', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create stub');
        }

        const created = await res.json();
        setDrafts((prev) => [...prev, created]);
        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return null;
      }
    },
    [getAuthHeaders]
  );

  const toggleTask = useCallback(
    async (draftId: number, taskIndex: number) => {
      try {
        const res = await fetch(`/api/typefully/drafts/${draftId}`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ action: 'toggle_task', taskIndex }),
        });

        if (!res.ok) {
          throw new Error('Failed to toggle task');
        }

        const updated = await res.json();
        setDrafts((prev) =>
          prev.map((d) => (d.id === draftId ? updated : d))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    },
    [getAuthHeaders]
  );

  const reschedule = useCallback(
    async (draftId: number, newDate: string) => {
      try {
        const res = await fetch(`/api/typefully/drafts/${draftId}`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ scheduledDate: newDate }),
        });

        if (!res.ok) {
          throw new Error('Failed to reschedule');
        }

        const updated = await res.json();
        setDrafts((prev) =>
          prev.map((d) => (d.id === draftId ? updated : d))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    },
    [getAuthHeaders]
  );

  return {
    drafts,
    isLoading,
    error,
    refetch: fetchDrafts,
    createStub,
    toggleTask,
    reschedule,
  };
}
```

**Step 2: Commit**

```bash
git add app/intern/hooks/useDrafts.ts
git commit -m "feat(intern): add useDrafts hook for data fetching"
```

---

## Phase 4: UI Components

### Task 13: Updated Password Gate

**Files:**
- Create: `app/intern/components/PasswordGate.tsx`

**Step 1: Create new password gate with role detection**

```typescript
// app/intern/components/PasswordGate.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function PasswordGate() {
  const { login } = useAuth();
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    const success = await login(input);

    if (!success) {
      setError(true);
      setInput('');
    }

    setIsLoading(false);
  };

  return (
    <div className="intern-gate">
      <div className="intern-gate-container">
        <h1 className="intern-gate-title">ACCESS REQUIRED</h1>
        <p className="intern-gate-desc">
          Enter your access code to continue.
        </p>
        <form onSubmit={handleSubmit} className="intern-gate-form">
          <input
            type="password"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            placeholder="Enter access code"
            className={`intern-gate-input ${error ? 'intern-gate-input--error' : ''}`}
            autoFocus
            disabled={isLoading}
          />
          <button
            type="submit"
            className="intern-gate-btn"
            disabled={isLoading}
          >
            {isLoading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
          </button>
        </form>
        {error && <p className="intern-gate-error">ACCESS DENIED</p>}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/intern/components/PasswordGate.tsx
git commit -m "feat(intern): add updated PasswordGate component"
```

---

### Task 14: Tweet Embed Component

**Files:**
- Create: `app/intern/components/TweetEmbed.tsx`

**Step 1: Create tweet embed wrapper**

```typescript
// app/intern/components/TweetEmbed.tsx
'use client';

import { Tweet } from 'react-tweet';
import { extractTweetId } from '../lib/transforms';

interface TweetEmbedProps {
  url: string;
}

export function TweetEmbed({ url }: TweetEmbedProps) {
  const tweetId = extractTweetId(url);

  if (!tweetId) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="intern-tweet-link"
      >
        View on X
      </a>
    );
  }

  return (
    <div className="intern-tweet-embed">
      <Tweet id={tweetId} />
    </div>
  );
}
```

**Step 2: Add tweet embed styles to globals.css**

Add after the existing intern styles:

```css
/* Tweet Embed Styles */
.intern-tweet-embed {
  max-width: 550px;
  margin: 1rem 0;
}

.intern-tweet-embed [data-theme='light'] {
  --tweet-bg-color: var(--slate);
  --tweet-border-color: var(--edge-primary);
}

.intern-tweet-link {
  display: inline-block;
  padding: 0.5em 1em;
  background: var(--ultraviolet);
  color: var(--white);
  text-decoration: none;
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.intern-tweet-link:hover {
  background: var(--magma);
}
```

**Step 3: Commit**

```bash
git add app/intern/components/TweetEmbed.tsx app/globals.css
git commit -m "feat(intern): add TweetEmbed component"
```

---

### Task 15: Task Checkbox Component

**Files:**
- Create: `app/intern/components/TaskList.tsx`

**Step 1: Create task list with checkboxes**

```typescript
// app/intern/components/TaskList.tsx
'use client';

import type { Task } from '../types/typefully';
import { ASSIGNEE_COLORS } from '../types/typefully';

interface TaskListProps {
  tasks: Task[];
  onToggle: (taskIndex: number) => void;
  disabled?: boolean;
}

export function TaskList({ tasks, onToggle, disabled = false }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="intern-tasks-empty">No tasks</p>;
  }

  return (
    <ul className="intern-tasks-list">
      {tasks.map((task, index) => (
        <li key={task.id} className="intern-task-item">
          <label className="intern-task-label">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggle(index)}
              disabled={disabled}
              className="intern-task-checkbox"
            />
            <span
              className={`intern-task-text ${task.completed ? 'intern-task-text--done' : ''}`}
            >
              {task.text}
            </span>
            {task.assignee && (
              <span
                className="intern-task-assignee"
                style={{
                  backgroundColor: ASSIGNEE_COLORS[task.assignee] || '#666',
                }}
              >
                @{task.assignee}
              </span>
            )}
          </label>
        </li>
      ))}
    </ul>
  );
}
```

**Step 2: Add task styles to globals.css**

```css
/* Task List Styles */
.intern-tasks-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0;
}

.intern-tasks-empty {
  color: #666;
  font-size: 0.875rem;
  font-style: italic;
}

.intern-task-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.intern-task-item:last-child {
  border-bottom: none;
}

.intern-task-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.intern-task-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--green);
  cursor: pointer;
}

.intern-task-checkbox:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.intern-task-text {
  flex: 1;
  font-family: 'PP Mori', sans-serif;
  font-size: 0.875rem;
  color: var(--white);
}

.intern-task-text--done {
  text-decoration: line-through;
  opacity: 0.6;
}

.intern-task-assignee {
  padding: 0.125rem 0.5rem;
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.625rem;
  color: #000;
  text-transform: uppercase;
  border-radius: 2px;
}
```

**Step 3: Commit**

```bash
git add app/intern/components/TaskList.tsx app/globals.css
git commit -m "feat(intern): add TaskList component with checkboxes"
```

---

### Task 16: Draft Card Component

**Files:**
- Create: `app/intern/components/DraftCard.tsx`

**Step 1: Create draft card for both views**

```typescript
// app/intern/components/DraftCard.tsx
'use client';

import type { DashboardDraft, UserRole } from '../types/typefully';
import { TaskList } from './TaskList';
import { TweetEmbed } from './TweetEmbed';

interface DraftCardProps {
  draft: DashboardDraft;
  role: UserRole;
  onToggleTask?: (draftId: number, taskIndex: number) => void;
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#666',
  scheduled: '#fd8f3a',
  published: '#14f1b2',
  publishing: '#6939ca',
  error: '#ef5c6f',
};

export function DraftCard({ draft, role, onToggleTask }: DraftCardProps) {
  const isEditor = role === 'editor';
  const isPublished = draft.status === 'published';

  return (
    <div className="intern-draft-card">
      <div className="intern-draft-header">
        <span
          className="intern-draft-status"
          style={{ backgroundColor: STATUS_COLORS[draft.status] || '#666' }}
        >
          {draft.status}
        </span>
        {draft.scheduledTime && (
          <span className="intern-draft-time">{draft.scheduledTime} UTC</span>
        )}
      </div>

      <h4 className="intern-draft-title">{draft.title}</h4>

      {draft.preview && (
        <p className="intern-draft-preview">{draft.preview}</p>
      )}

      {/* Show embedded tweet for published drafts */}
      {isPublished && draft.publishedUrl && (
        <TweetEmbed url={draft.publishedUrl} />
      )}

      {/* Show tasks only for editors */}
      {isEditor && draft.tasks.length > 0 && (
        <div className="intern-draft-tasks">
          <h5 className="intern-draft-tasks-title">Tasks</h5>
          <TaskList
            tasks={draft.tasks}
            onToggle={(taskIndex) => onToggleTask?.(draft.id, taskIndex)}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="intern-draft-actions">
        <a
          href={draft.editUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="intern-draft-btn intern-draft-btn--edit"
        >
          {isPublished ? 'View on Typefully' : 'Edit on Typefully'}
        </a>

        {isPublished && draft.publishedUrl && (
          <a
            href={draft.publishedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="intern-draft-btn intern-draft-btn--view"
          >
            View Post
          </a>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Add draft card styles to globals.css**

```css
/* Draft Card Styles */
.intern-draft-card {
  background: rgba(14, 21, 26, 0.8);
  border: 1px solid rgba(180, 148, 247, 0.3);
  padding: 1rem;
  margin-bottom: 1rem;
}

.intern-draft-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.intern-draft-status {
  padding: 0.125rem 0.5rem;
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.625rem;
  color: #000;
  text-transform: uppercase;
}

.intern-draft-time {
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.75rem;
  color: #888;
}

.intern-draft-title {
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 1rem;
  color: var(--white);
  margin: 0 0 0.5rem;
}

.intern-draft-preview {
  font-family: 'PP Mori', sans-serif;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 1rem;
  line-height: 1.4;
}

.intern-draft-tasks {
  margin: 1rem 0;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.intern-draft-tasks-title {
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
  margin: 0 0 0.5rem;
}

.intern-draft-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.intern-draft-btn {
  padding: 0.5em 1em;
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 0.75rem;
  text-transform: uppercase;
  text-decoration: none;
  border: 1px solid;
}

.intern-draft-btn--edit {
  background: transparent;
  color: var(--ultraviolet);
  border-color: var(--ultraviolet);
}

.intern-draft-btn--edit:hover {
  background: var(--ultraviolet);
  color: #000;
}

.intern-draft-btn--view {
  background: var(--green);
  color: #000;
  border-color: var(--green);
}

.intern-draft-btn--view:hover {
  background: transparent;
  color: var(--green);
}
```

**Step 3: Commit**

```bash
git add app/intern/components/DraftCard.tsx app/globals.css
git commit -m "feat(intern): add DraftCard component"
```

---

### Task 17: Create Stub Form Component

**Files:**
- Create: `app/intern/components/CreateStubForm.tsx`

**Step 1: Create stub draft form for editors**

```typescript
// app/intern/components/CreateStubForm.tsx
'use client';

import { useState } from 'react';

interface CreateStubFormProps {
  selectedDate: string;
  onSubmit: (data: {
    title: string;
    brief: string;
    scheduledDate: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function CreateStubForm({
  selectedDate,
  onSubmit,
  onCancel,
}: CreateStubFormProps) {
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    await onSubmit({
      title: title.trim(),
      brief: brief.trim(),
      scheduledDate: selectedDate,
    });
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="intern-stub-form">
      <h3 className="intern-stub-form-title">Create Stub Draft</h3>
      <p className="intern-stub-form-date">
        Scheduled for: {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </p>

      <div className="intern-stub-field">
        <label htmlFor="stub-title" className="intern-stub-label">
          Title *
        </label>
        <input
          id="stub-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Meet the Judges"
          className="intern-stub-input"
          required
          autoFocus
        />
      </div>

      <div className="intern-stub-field">
        <label htmlFor="stub-brief" className="intern-stub-label">
          Brief / Content Direction
        </label>
        <textarea
          id="stub-brief"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="What should this post be about? Any specific notes for Rizzy..."
          className="intern-stub-textarea"
          rows={4}
        />
      </div>

      <p className="intern-stub-note">
        Default tasks will be added: Create content (@rizzy), Review (@kemo)
      </p>

      <div className="intern-stub-actions">
        <button
          type="button"
          onClick={onCancel}
          className="intern-stub-btn intern-stub-btn--cancel"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="intern-stub-btn intern-stub-btn--submit"
          disabled={isSubmitting || !title.trim()}
        >
          {isSubmitting ? 'Creating...' : 'Create Stub'}
        </button>
      </div>
    </form>
  );
}
```

**Step 2: Add stub form styles to globals.css**

```css
/* Create Stub Form Styles */
.intern-stub-form {
  background: rgba(14, 21, 26, 0.95);
  border: 2px solid var(--ultraviolet);
  padding: 1.5rem;
  max-width: 500px;
}

.intern-stub-form-title {
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 1rem;
  color: var(--white);
  text-transform: uppercase;
  margin: 0 0 0.5rem;
}

.intern-stub-form-date {
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.75rem;
  color: var(--amber);
  margin: 0 0 1.5rem;
}

.intern-stub-field {
  margin-bottom: 1rem;
}

.intern-stub-label {
  display: block;
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.intern-stub-input,
.intern-stub-textarea {
  width: 100%;
  padding: 0.75rem;
  font-family: 'PP Mori', sans-serif;
  font-size: 0.875rem;
  color: var(--white);
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(180, 148, 247, 0.3);
}

.intern-stub-input:focus,
.intern-stub-textarea:focus {
  outline: none;
  border-color: var(--ultraviolet);
}

.intern-stub-textarea {
  resize: vertical;
  min-height: 100px;
}

.intern-stub-note {
  font-family: 'PP Mori', sans-serif;
  font-size: 0.75rem;
  color: #666;
  margin: 1rem 0;
  font-style: italic;
}

.intern-stub-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.intern-stub-btn {
  padding: 0.75em 1.5em;
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 0.75rem;
  text-transform: uppercase;
  border: 1px solid;
  cursor: pointer;
}

.intern-stub-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.intern-stub-btn--cancel {
  background: transparent;
  color: #888;
  border-color: #888;
}

.intern-stub-btn--cancel:hover:not(:disabled) {
  color: var(--white);
  border-color: var(--white);
}

.intern-stub-btn--submit {
  background: var(--ultraviolet);
  color: #000;
  border-color: var(--ultraviolet);
}

.intern-stub-btn--submit:hover:not(:disabled) {
  background: var(--green);
  border-color: var(--green);
}
```

**Step 3: Commit**

```bash
git add app/intern/components/CreateStubForm.tsx app/globals.css
git commit -m "feat(intern): add CreateStubForm component"
```

---

## Phase 5: Main Page Refactor

### Task 18: Refactor Page with New Architecture

**Files:**
- Modify: `app/intern/page.tsx`

**Step 1: Rewrite page with auth context and Typefully data**

```typescript
// app/intern/page.tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useDrafts } from './hooks/useDrafts';
import { groupDraftsByDate } from './lib/transforms';
import { CalendarGrid } from './CalendarGrid';
import { PasswordGate } from './components/PasswordGate';
import { DraftCard } from './components/DraftCard';
import { CreateStubForm } from './components/CreateStubForm';
import type { DashboardDraft } from './types/typefully';

// ============================================================================
// Helpers
// ============================================================================

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ============================================================================
// Dashboard Content Component
// ============================================================================

function DashboardContent() {
  const { role, logout } = useAuth();
  const { drafts, isLoading, error, refetch, createStub, toggleTask } = useDrafts();

  const todayKey = toDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const isEditor = role === 'editor';

  // Group drafts by date for calendar
  const draftsByDate = useMemo(() => {
    return groupDraftsByDate(drafts);
  }, [drafts]);

  // Get drafts for selected date
  const selectedDrafts = useMemo(() => {
    return draftsByDate.get(selectedDate) || [];
  }, [draftsByDate, selectedDate]);

  // Build post count map for calendar dots
  const postCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const [date, dayDrafts] of draftsByDate) {
      if (date !== 'unscheduled') {
        map.set(date, dayDrafts.length);
      }
    }
    return map;
  }, [draftsByDate]);

  const handleCreateStub = useCallback(
    async (data: { title: string; brief: string; scheduledDate: string }) => {
      await createStub(data);
      setShowCreateForm(false);
    },
    [createStub]
  );

  const handleToggleTask = useCallback(
    (draftId: number, taskIndex: number) => {
      toggleTask(draftId, taskIndex);
    },
    [toggleTask]
  );

  const formattedDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );

  return (
    <div className="intern-page">
      <header className="intern-header">
        <div className="intern-header-left">
          <h1 className="intern-title">INTERN.exe</h1>
          <p className="intern-subtitle">
            {isEditor ? 'Editor Dashboard' : 'Content Review'}
          </p>
        </div>
        <div className="intern-header-right">
          <span className="intern-role-badge">
            {role?.toUpperCase()}
          </span>
          <button onClick={logout} className="intern-logout-btn">
            LOGOUT
          </button>
        </div>
      </header>

      <main className="intern-main">
        <div className="intern-calendar-pane">
          <CalendarGrid
            year={2026}
            month={1}
            eventsByDate={new Map()}
            postCountByDate={postCountByDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          <CalendarGrid
            year={2026}
            month={2}
            eventsByDate={new Map()}
            postCountByDate={postCountByDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        <div className="intern-details-pane">
          <div className="intern-details-header">
            <div>
              <h2 className="intern-details-date">{formattedDate}</h2>
            </div>
            <div className="intern-details-actions">
              {isEditor && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="intern-create-btn"
                >
                  + Create Stub
                </button>
              )}
              <button onClick={refetch} className="intern-refresh-btn">
                Refresh
              </button>
            </div>
          </div>

          {showCreateForm && isEditor && (
            <CreateStubForm
              selectedDate={selectedDate}
              onSubmit={handleCreateStub}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          {isLoading && (
            <div className="intern-loading">Loading drafts...</div>
          )}

          {error && (
            <div className="intern-error">Error: {error}</div>
          )}

          {!isLoading && !error && selectedDrafts.length === 0 && (
            <div className="intern-empty-state">
              <p>No drafts scheduled for this date.</p>
              {isEditor && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="intern-empty-create-btn"
                >
                  Create a stub draft
                </button>
              )}
            </div>
          )}

          {!isLoading && !error && selectedDrafts.length > 0 && (
            <div className="intern-drafts-list">
              {selectedDrafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  role={role!}
                  onToggleTask={isEditor ? handleToggleTask : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

function InternPageInner() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="intern-page">
        <div className="intern-loading">INITIALIZING...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordGate />;
  }

  return <DashboardContent />;
}

export default function InternPage() {
  return (
    <AuthProvider>
      <InternPageInner />
    </AuthProvider>
  );
}
```

**Step 2: Add new header and layout styles to globals.css**

```css
/* Updated Header Styles */
.intern-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid rgba(180, 148, 247, 0.3);
}

.intern-header-left {
  display: flex;
  flex-direction: column;
}

.intern-header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.intern-role-badge {
  padding: 0.25rem 0.75rem;
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.625rem;
  background: var(--ultraviolet);
  color: #000;
}

.intern-logout-btn {
  padding: 0.5rem 1rem;
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 0.75rem;
  text-transform: uppercase;
  background: transparent;
  color: #888;
  border: 1px solid #888;
  cursor: pointer;
}

.intern-logout-btn:hover {
  color: var(--magma);
  border-color: var(--magma);
}

/* Details Pane Updates */
.intern-details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.intern-details-actions {
  display: flex;
  gap: 0.5rem;
}

.intern-create-btn {
  padding: 0.5rem 1rem;
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 0.75rem;
  text-transform: uppercase;
  background: var(--green);
  color: #000;
  border: none;
  cursor: pointer;
}

.intern-create-btn:hover {
  background: var(--ultraviolet);
}

.intern-error {
  padding: 1rem;
  background: rgba(239, 92, 111, 0.2);
  border: 1px solid var(--magma);
  color: var(--magma);
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.875rem;
}

.intern-drafts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.intern-empty-create-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 0.75rem;
  text-transform: uppercase;
  background: transparent;
  color: var(--ultraviolet);
  border: 1px solid var(--ultraviolet);
  cursor: pointer;
}

.intern-empty-create-btn:hover {
  background: var(--ultraviolet);
  color: #000;
}
```

**Step 3: Commit**

```bash
git add app/intern/page.tsx app/globals.css
git commit -m "feat(intern): refactor page with Typefully integration"
```

---

### Task 19: Clean Up Old Data File

**Files:**
- Modify: `app/intern/data.ts`

**Step 1: Simplify data.ts to only export needed constants**

```typescript
// app/intern/data.ts

// Re-export calendar events from InfoWindow for event overlay
export { CONTENT } from '../components/InfoWindow';

// Legacy types kept for reference - new types in types/typefully.ts
export type ContentStatus = 'SENT' | 'Scheduled' | 'Ready' | 'Waiting';

// Status colors (kept for backward compatibility with CalendarGrid)
export const STATUS_COLORS: Record<ContentStatus, string> = {
  SENT: '#14f1b2',
  Scheduled: '#fd8f3a',
  Ready: '#6939ca',
  Waiting: '#0e151a',
};

// Note: PLANNING_DATA has been removed.
// Data now comes from Typefully API via /api/typefully/drafts
```

**Step 2: Commit**

```bash
git add app/intern/data.ts
git commit -m "refactor(intern): remove hardcoded PLANNING_DATA"
```

---

### Task 20: Update CalendarGrid for Typefully

**Files:**
- Modify: `app/intern/CalendarGrid.tsx`

**Step 1: Add draft status indicator support**

The CalendarGrid already accepts `postCountByDate`, which we're now populating from Typefully. Update the component to also show assignee colors if needed.

Read the current CalendarGrid first to understand its structure, then add assignee color dots.

```typescript
// Add to CalendarGrid.tsx - update the day cell rendering to show task assignee bubbles

// In the day cell, after the post count badge, add:
{/* Assignee indicators would go here if we pass them */}
```

For now, the existing CalendarGrid works with the new `postCountByDate` map from Typefully data. A future enhancement could show assignee colors.

**Step 2: Commit**

```bash
git add app/intern/CalendarGrid.tsx
git commit -m "chore(intern): document CalendarGrid Typefully compatibility"
```

---

## Phase 6: Testing & Verification

### Task 21: Manual Testing Checklist

**No files to modify - verification steps**

**Step 1: Set up environment**

1. Add Typefully API key to `.env.local`:
   ```
   TYPEFULLY_API_KEY=your_key
   TYPEFULLY_SOCIAL_SET_ID=your_id
   NEXT_PUBLIC_INTERN_REVIEWER_PASSWORD=reviewer123
   INTERN_EDITOR_PASSWORD=editor456
   ```

2. Create required tags in Typefully dashboard:
   - `rizzy`
   - `kemo`
   - `cronus`

**Step 2: Test reviewer flow**

1. Go to `/intern`
2. Enter reviewer password
3. Verify: Clean view, no task checkboxes, no create button
4. Click a day with content
5. Verify: Drafts show with status, preview, "View on Typefully" button
6. For published drafts: Verify embedded tweet appears

**Step 3: Test editor flow**

1. Logout, re-enter with editor password
2. Verify: Task checkboxes visible, "Create Stub" button appears
3. Click "Create Stub" → fill form → submit
4. Verify: New draft appears in Typefully
5. Check a task checkbox
6. Verify: Scratchpad updates in Typefully

**Step 4: Commit verification notes**

```bash
git commit --allow-empty -m "test(intern): verify Typefully integration manually"
```

---

### Task 22: Final Documentation Update

**Files:**
- Modify: `docs/brainstorms/2026-02-04-intern-v3-typefully-brainstorm.md`

**Step 1: Update brainstorm status**

Change status from "Decided" to "Implemented" and add implementation notes.

**Step 2: Commit**

```bash
git add docs/brainstorms/2026-02-04-intern-v3-typefully-brainstorm.md
git commit -m "docs: mark intern v3 brainstorm as implemented"
```

---

## Summary

**Total Tasks:** 22

**Phase 1 (Foundation):** Tasks 1-6 - Types, env, API client, utilities
**Phase 2 (API Routes):** Tasks 7-10 - Drafts and tags endpoints
**Phase 3 (Auth):** Tasks 11-12 - Two-tier auth context and drafts hook
**Phase 4 (Components):** Tasks 13-17 - UI components
**Phase 5 (Integration):** Tasks 18-20 - Page refactor and cleanup
**Phase 6 (Verification):** Tasks 21-22 - Testing and docs

**Key Files Created:**
- `app/intern/types/typefully.ts`
- `app/intern/lib/typefully.ts`
- `app/intern/lib/tasks.ts`
- `app/intern/lib/transforms.ts`
- `app/intern/context/AuthContext.tsx`
- `app/intern/hooks/useDrafts.ts`
- `app/intern/components/PasswordGate.tsx`
- `app/intern/components/TweetEmbed.tsx`
- `app/intern/components/TaskList.tsx`
- `app/intern/components/DraftCard.tsx`
- `app/intern/components/CreateStubForm.tsx`
- `app/api/typefully/drafts/route.ts`
- `app/api/typefully/drafts/[id]/route.ts`
- `app/api/typefully/tags/route.ts`
