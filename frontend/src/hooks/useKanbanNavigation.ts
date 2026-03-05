import { useCallback, useMemo } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import type { IssuePriority } from '@/stores/useUiPreferencesStore';
import {
  buildIssueCreatePath,
  buildIssuePath,
  buildIssueWorkspacePath,
  buildProjectRootPath,
  buildWorkspaceCreatePath,
  parseProjectSidebarRoute,
} from '@/lib/routes/projectSidebarRoutes';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

/**
 * Hook for project-kanban right sidebar navigation.
 * URL is the single source of truth for sidebar mode.
 *
 * URL patterns:
 * - View issue: /projects/:projectId/issues/:issueId
 * - View issue workspace: /projects/:projectId/issues/:issueId/workspaces/:workspaceId
 * - Create issue: /projects/:projectId/issues/new?statusId=xxx&priority=high
 * - Create workspace (linked): /projects/:projectId/issues/:issueId/workspaces/create/:draftId
 * - Create workspace (standalone): /projects/:projectId/workspaces/create/:draftId
 * - No issue: /projects/:projectId
 */
export function useKanbanNavigation() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({
    select: (s) => (s.location.search as Record<string, unknown>) ?? {},
  });

  const routeState = useMemo(
    () => parseProjectSidebarRoute(pathname),
    [pathname]
  );

  const projectId = routeState?.projectId ?? null;

  const issueId = useMemo(() => {
    if (!routeState) return null;
    if (routeState.type === 'issue') return routeState.issueId;
    if (routeState.type === 'issue-workspace') return routeState.issueId;
    if (routeState.type === 'workspace-create') return routeState.issueId;
    return null;
  }, [routeState]);

  const workspaceId =
    routeState?.type === 'issue-workspace' ? routeState.workspaceId : null;
  const rawDraftId =
    routeState?.type === 'workspace-create' ? routeState.draftId : null;
  const draftId = rawDraftId && isValidUuid(rawDraftId) ? rawDraftId : null;
  const hasInvalidWorkspaceCreateDraftId =
    routeState?.type === 'workspace-create' && rawDraftId !== null && !draftId;

  const isCreateMode = routeState?.type === 'issue-create';
  const isWorkspaceCreateMode =
    routeState?.type === 'workspace-create' && draftId !== null;
  const isPanelOpen = !!routeState && routeState.type !== 'closed';

  const createDefaultStatusId =
    typeof search.statusId === 'string' ? search.statusId : null;
  const createDefaultPriority =
    typeof search.priority === 'string'
      ? (search.priority as IssuePriority)
      : null;
  const createDefaultAssigneeIds =
    typeof search.assignees === 'string'
      ? search.assignees.split(',').filter(Boolean)
      : null;
  const createDefaultParentIssueId =
    typeof search.parentIssueId === 'string' ? search.parentIssueId : null;

  const openIssue = useCallback(
    (id: string) => {
      if (!projectId) return;
      navigate({ to: buildIssuePath(projectId, id) as never } as never);
    },
    [navigate, projectId]
  );

  const openIssueWorkspace = useCallback(
    (id: string, workspaceAttemptId: string) => {
      if (!projectId) return;
      navigate({
        to: buildIssueWorkspacePath(projectId, id, workspaceAttemptId) as never,
      } as never);
    },
    [navigate, projectId]
  );

  const openWorkspaceCreate = useCallback(
    (workspaceDraftId: string, options?: { issueId?: string | null }) => {
      if (!projectId) return;
      const targetIssueId = options?.issueId ?? issueId;
      navigate({
        to: buildWorkspaceCreatePath(
          projectId,
          workspaceDraftId,
          targetIssueId
        ) as never,
      } as never);
    },
    [navigate, projectId, issueId]
  );

  const closePanel = useCallback(() => {
    if (!projectId) return;
    navigate({ to: buildProjectRootPath(projectId) as never } as never);
  }, [navigate, projectId]);

  const startCreate = useCallback(
    (options?: {
      statusId?: string;
      priority?: IssuePriority;
      assigneeIds?: string[];
      parentIssueId?: string;
    }) => {
      if (!projectId) return;
      navigate({ to: buildIssueCreatePath(projectId, options) as never } as never);
    },
    [navigate, projectId]
  );

  const updateCreateDefaults = useCallback(
    (options: {
      statusId?: string;
      priority?: IssuePriority | null;
      assigneeIds?: string[];
    }) => {
      if (!projectId || !isCreateMode) return;
      navigate({
        to: buildIssueCreatePath(projectId) as never,
        replace: true,
        search: ((prev: unknown) => {
          const next = { ...(prev as Record<string, unknown>) } as Record<
            string,
            unknown
          >;
          if (options.statusId !== undefined) next.statusId = options.statusId;
          if (options.priority !== undefined) {
            if (options.priority === null) delete next.priority;
            else next.priority = options.priority;
          }
          if (options.assigneeIds !== undefined) {
            next.assignees = options.assigneeIds.join(',');
          }
          return next;
        }) as never,
      } as never);
    },
    [navigate, projectId, isCreateMode]
  );

  return {
    projectId,
    issueId,
    workspaceId,
    draftId,
    sidebarMode: routeState?.type ?? null,
    isCreateMode,
    isWorkspaceCreateMode,
    hasInvalidWorkspaceCreateDraftId,
    isPanelOpen,
    createDefaultStatusId,
    createDefaultPriority,
    createDefaultAssigneeIds,
    createDefaultParentIssueId,
    openIssue,
    openIssueWorkspace,
    openWorkspaceCreate,
    closePanel,
    startCreate,
    updateCreateDefaults,
  };
}
