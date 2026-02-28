import { useVirtualizer } from '@tanstack/react-virtual';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import DisplayConversationEntry from '../NormalizedConversation/DisplayConversationEntry';
import { useEntries } from '@/contexts/EntriesContext';
import {
  AddEntryType,
  PatchTypeWithKey,
  useConversationHistory,
} from '@/hooks/useConversationHistory';
import { Loader2 } from 'lucide-react';
import { TaskWithAttemptStatus } from 'shared/types';
import type { WorkspaceWithSession } from '@/types/attempt';
import { ApprovalFormProvider } from '@/contexts/ApprovalFormContext';

interface VirtualizedListProps {
  attempt: WorkspaceWithSession;
  task?: TaskWithAttemptStatus;
}

const ESTIMATED_ITEM_SIZE = 120;

const VirtualizedList = ({ attempt, task }: VirtualizedListProps) => {
  const [entries, setEntriesState] = useState<PatchTypeWithKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const { setEntries, reset } = useEntries();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevEntryCountRef = useRef(0);
  const addTypeRef = useRef<AddEntryType>('initial');

  useEffect(() => {
    setLoading(true);
    setEntriesState([]);
    setShouldAutoScroll(true);
    prevEntryCountRef.current = 0;
    reset();
  }, [attempt.id, reset]);

  const onEntriesUpdated = useCallback(
    (
      newEntries: PatchTypeWithKey[],
      addType: AddEntryType,
      newLoading: boolean
    ) => {
      addTypeRef.current = addType;
      setEntriesState(newEntries);
      setEntries(newEntries);

      if (loading) {
        setLoading(newLoading);
      }
    },
    [loading, setEntries]
  );

  useConversationHistory({ attempt, onEntriesUpdated });

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ESTIMATED_ITEM_SIZE,
    getItemKey: (index) => `l-${entries[index].patchKey}`,
    overscan: 5,
  });

  // Detect user scroll to disable auto-scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to bottom when new entries arrive
  useLayoutEffect(() => {
    if (entries.length === 0) return;

    const isNewData = entries.length !== prevEntryCountRef.current;
    prevEntryCountRef.current = entries.length;

    if (!isNewData) return;

    const addType = addTypeRef.current;

    // Always scroll to bottom on initial load
    if (addType === 'initial') {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(entries.length - 1, { align: 'end' });
      });
      return;
    }

    // For running/plan updates, only scroll if user is near bottom
    if (
      (addType === 'running' || addType === 'plan') &&
      shouldAutoScroll
    ) {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(entries.length - 1, {
          align: 'end',
          behavior: 'smooth',
        });
      });
    }
  }, [entries, shouldAutoScroll, virtualizer]);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <ApprovalFormProvider>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <div className="h-2" />
          {virtualItems.map((virtualItem) => {
            const data = entries[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <ItemContent data={data} attempt={attempt} task={task} />
              </div>
            );
          })}
          <div className="h-2" />
        </div>
      </div>
      {loading && (
        <div className="float-left top-0 left-0 w-full h-full bg-primary flex flex-col gap-2 justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading History</p>
        </div>
      )}
    </ApprovalFormProvider>
  );
};

function ItemContent({
  data,
  attempt,
  task,
}: {
  data: PatchTypeWithKey;
  attempt: WorkspaceWithSession;
  task?: TaskWithAttemptStatus;
}) {
  if (data.type === 'STDOUT') {
    return <p>{data.content}</p>;
  }
  if (data.type === 'STDERR') {
    return <p>{data.content}</p>;
  }
  if (data.type === 'NORMALIZED_ENTRY' && attempt) {
    return (
      <DisplayConversationEntry
        expansionKey={data.patchKey}
        entry={data.content}
        executionProcessId={data.executionProcessId}
        taskAttempt={attempt}
        task={task}
      />
    );
  }

  return null;
}

export default VirtualizedList;
