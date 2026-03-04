import { useEffect, useState, useRef } from 'react';
import type { PatchType } from 'shared/types';

type LogEntry = Extract<PatchType, { type: 'STDOUT' } | { type: 'STDERR' }>;

const MAX_LOG_ENTRIES = 10000;
const FLUSH_INTERVAL_MS = 50;

interface UseLogStreamResult {
  logs: LogEntry[];
  error: string | null;
}

export const useLogStream = (processId: string): UseLogStreamResult => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef<number>(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logsBufferRef = useRef<LogEntry[]>([]);
  const isIntentionallyClosed = useRef<boolean>(false);
  // Track current processId to prevent stale WebSocket messages from contaminating logs
  const currentProcessIdRef = useRef<string>(processId);

  useEffect(() => {
    if (!processId) {
      return;
    }

    // Update the ref to track the current processId
    currentProcessIdRef.current = processId;

    // Clear logs when process changes
    logsBufferRef.current = [];
    setLogs([]);
    setError(null);

    const flushLogs = () => {
      flushTimerRef.current = null;
      setLogs([...logsBufferRef.current]);
    };

    const scheduleFlush = () => {
      if (flushTimerRef.current) return;
      flushTimerRef.current = setTimeout(flushLogs, FLUSH_INTERVAL_MS);
    };

    const open = () => {
      // Capture processId at the time of opening the WebSocket
      const capturedProcessId = processId;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const ws = new WebSocket(
        `${protocol}//${host}/api/execution-processes/${processId}/raw-logs/ws`
      );
      wsRef.current = ws;
      isIntentionallyClosed.current = false;

      ws.onopen = () => {
        // Ignore if processId has changed since WebSocket was opened
        if (currentProcessIdRef.current !== capturedProcessId) {
          ws.close();
          return;
        }
        setError(null);
        // Reset logs on new connection since server replays history
        logsBufferRef.current = [];
        setLogs([]);
        retryCountRef.current = 0;
      };

      const appendLogEntries = (newEntries: LogEntry[]) => {
        if (newEntries.length === 0) return;

        // Only add log entries if this WebSocket is still for the current process
        if (currentProcessIdRef.current !== capturedProcessId) {
          return;
        }

        const buffer = logsBufferRef.current;
        buffer.push(...newEntries);

        if (buffer.length > MAX_LOG_ENTRIES) {
          buffer.splice(0, buffer.length - MAX_LOG_ENTRIES);
        }

        scheduleFlush();
      };

      // Handle WebSocket messages
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle different message types based on LogMsg enum
          if ('JsonPatch' in data) {
            const patches = data.JsonPatch as Array<{ value?: PatchType }>;
            const parsedEntries: LogEntry[] = [];
            patches.forEach((patch) => {
              const value = patch?.value;
              if (!value || !value.type) return;

              switch (value.type) {
                case 'STDOUT':
                case 'STDERR':
                  parsedEntries.push({
                    type: value.type,
                    content: value.content,
                  });
                  break;
                // Ignore other patch types (NORMALIZED_ENTRY, DIFF, etc.)
                default:
                  break;
              }
            });
            appendLogEntries(parsedEntries);
          } else if (data.finished === true) {
            isIntentionallyClosed.current = true;
            ws.close();
          }
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      ws.onerror = () => {
        // Ignore errors from stale WebSocket connections
        if (currentProcessIdRef.current !== capturedProcessId) {
          return;
        }
        setError('Connection failed');
      };

      ws.onclose = (event) => {
        // Don't retry for stale WebSocket connections
        if (currentProcessIdRef.current !== capturedProcessId) {
          return;
        }
        // Only retry if the close was not intentional and not a normal closure
        if (!isIntentionallyClosed.current && event.code !== 1000) {
          const next = retryCountRef.current + 1;
          retryCountRef.current = next;
          if (next <= 6) {
            const delay = Math.min(1500, 250 * 2 ** (next - 1));
            retryTimerRef.current = setTimeout(() => open(), delay);
          }
        }
      };
    };

    open();

    return () => {
      if (wsRef.current) {
        isIntentionallyClosed.current = true;
        wsRef.current.close();
        wsRef.current = null;
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };
  }, [processId]);

  return { logs, error };
};
