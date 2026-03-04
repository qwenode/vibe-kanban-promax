// streamJsonPatchEntries.ts - WebSocket JSON patch streaming utility
import type { Operation } from 'rfc6902';
import { applyUpsertPatch } from '@/utils/jsonPatch';

type PatchContainer<E = unknown> = { entries: E[] };

export interface StreamSnapshotMeta {
  /** Absolute index of the first item retained in `entries` */
  entriesOffset: number;
  /** Total number of entries seen so far (offset + retained length) */
  totalEntries: number;
}

export interface StreamOptions<E = unknown> {
  initial?: PatchContainer<E>;
  /** called after each successful patch application */
  onEntries?: (entries: E[], meta: StreamSnapshotMeta) => void;
  onConnect?: () => void;
  onError?: (err: unknown) => void;
  /** called when websocket closes (manual close, finished, or disconnect) */
  onClose?: () => void;
  /** Keep only the latest N entries in-memory to prevent OOM */
  maxEntries?: number;
  /** called once when a "finished" event is received */
  onFinished?: (entries: E[], meta: StreamSnapshotMeta) => void;
}

interface StreamController<E = unknown> {
  /** Current entries array (immutable snapshot) */
  getEntries(): E[];
  /** Full { entries } snapshot */
  getSnapshot(): PatchContainer<E>;
  /** Best-effort connection state */
  isConnected(): boolean;
  /** Subscribe to updates; returns an unsubscribe function */
  onChange(cb: (entries: E[], meta: StreamSnapshotMeta) => void): () => void;
  /** Close the stream */
  close(): void;
}

/**
 * Connect to a WebSocket endpoint that emits JSON messages containing:
 *   {"JsonPatch": [{"op": "add", "path": "/entries/0", "value": {...}}, ...]}
 *   {"Finished": ""}
 *
 * Maintains an in-memory { entries: [] } snapshot and returns a controller.
 */
export function streamJsonPatchEntries<E = unknown>(
  url: string,
  opts: StreamOptions<E> = {}
): StreamController<E> {
  let connected = false;
  const snapshot: PatchContainer<E> = structuredClone(
    opts.initial ?? ({ entries: [] } as PatchContainer<E>)
  );
  let entriesOffset = 0;

  const getMeta = (): StreamSnapshotMeta => ({
    entriesOffset,
    totalEntries: entriesOffset + snapshot.entries.length,
  });

  const subscribers = new Set<
    (entries: E[], meta: StreamSnapshotMeta) => void
  >();
  if (opts.onEntries) subscribers.add(opts.onEntries);

  const enforceMaxEntries = () => {
    if (!opts.maxEntries || opts.maxEntries <= 0) return;
    if (snapshot.entries.length <= opts.maxEntries) return;

    const trimCount = snapshot.entries.length - opts.maxEntries;
    snapshot.entries.splice(0, trimCount);
    entriesOffset += trimCount;
  };

  enforceMaxEntries();

  // Convert HTTP endpoint to WebSocket endpoint
  const wsUrl = url.replace(/^http/, 'ws');
  const ws = new WebSocket(wsUrl);

  const notify = () => {
    const meta = getMeta();
    for (const cb of subscribers) {
      try {
        cb(snapshot.entries, meta);
      } catch {
        /* swallow subscriber errors */
      }
    }
  };

  const handleMessage = (event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);

      // Handle JsonPatch messages (from LogMsg::to_ws_message)
      if (msg.JsonPatch) {
        const raw = msg.JsonPatch as Operation[];
        const ops = remapOperationsToOffset(dedupeOps(raw), entriesOffset);

        if (ops.length > 0) {
          applyUpsertPatch(snapshot, ops);
          enforceMaxEntries();
        }

        notify();
      }

      // Handle Finished messages
      if (msg.finished !== undefined) {
        opts.onFinished?.(snapshot.entries, getMeta());
        ws.close();
      }
    } catch (err) {
      opts.onError?.(err);
    }
  };

  ws.addEventListener('open', () => {
    connected = true;
    opts.onConnect?.();
  });

  ws.addEventListener('message', handleMessage);

  ws.addEventListener('error', (err) => {
    connected = false;
    opts.onError?.(err);
  });

  ws.addEventListener('close', () => {
    connected = false;
    opts.onClose?.();
  });

  return {
    getEntries(): E[] {
      return snapshot.entries;
    },
    getSnapshot(): PatchContainer<E> {
      return snapshot;
    },
    isConnected(): boolean {
      return connected;
    },
    onChange(cb: (entries: E[], meta: StreamSnapshotMeta) => void): () => void {
      subscribers.add(cb);
      // push current state immediately
      cb(snapshot.entries, getMeta());
      return () => subscribers.delete(cb);
    },
    close(): void {
      ws.close();
      subscribers.clear();
      connected = false;
    },
  };
}

function remapEntryPath(
  path: string,
  entriesOffset: number
): { path: string; drop: boolean } {
  const match = path.match(/^\/entries\/([^/]+)(.*)$/);
  if (!match) {
    return { path, drop: false };
  }

  const [, rawIndex, suffix] = match;
  if (rawIndex === '-') {
    return { path, drop: false };
  }

  const absoluteIndex = Number(rawIndex);
  if (!Number.isInteger(absoluteIndex)) {
    return { path, drop: false };
  }

  const remappedIndex = absoluteIndex - entriesOffset;
  if (remappedIndex < 0) {
    return { path: '', drop: true };
  }

  return {
    path: `/entries/${remappedIndex}${suffix}`,
    drop: false,
  };
}

function remapOperationsToOffset(
  ops: Operation[],
  entriesOffset: number
): Operation[] {
  const remapped: Operation[] = [];

  for (const op of ops) {
    const pathResult = remapEntryPath(op.path, entriesOffset);
    if (pathResult.drop) {
      continue;
    }

    const nextOp = {
      ...op,
      path: pathResult.path,
    } as Operation & { from?: string };

    if (typeof nextOp.from === 'string') {
      const fromResult = remapEntryPath(nextOp.from, entriesOffset);
      if (fromResult.drop) {
        continue;
      }
      nextOp.from = fromResult.path;
    }

    remapped.push(nextOp as Operation);
  }

  return remapped;
}

/**
 * Dedupe multiple ops that touch the same path within a single event.
 * Last write for a path wins, while preserving the overall left-to-right
 * order of the *kept* final operations.
 *
 * Example:
 *   add /entries/4, replace /entries/4  -> keep only the final replace
 */
function dedupeOps(ops: Operation[]): Operation[] {
  const lastIndexByPath = new Map<string, number>();
  ops.forEach((op, i) => lastIndexByPath.set(op.path, i));

  // Keep only the last op for each path, in ascending order of their final index
  const keptIndices = [...lastIndexByPath.values()].sort((a, b) => a - b);
  return keptIndices.map((i) => ops[i]!);
}
