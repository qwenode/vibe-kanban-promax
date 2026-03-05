import type { IssuePriority } from '@/stores/useUiPreferencesStore';

export type ProjectSidebarRouteState =
  | {
      type: 'closed';
      projectId: string;
    }
  | {
      type: 'issue-create';
      projectId: string;
    }
  | {
      type: 'issue';
      projectId: string;
      issueId: string;
    }
  | {
      type: 'issue-workspace';
      projectId: string;
      issueId: string;
      workspaceId: string;
    }
  | {
      type: 'workspace-create';
      projectId: string;
      draftId: string;
      issueId: string | null;
    };

export interface IssueCreateRouteOptions {
  statusId?: string;
  priority?: IssuePriority;
  assigneeIds?: string[];
  parentIssueId?: string;
}

function withSearch(pathname: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function buildProjectRootPath(projectId: string): string {
  return `/projects/${projectId}`;
}

export function buildIssuePath(projectId: string, issueId: string): string {
  return `/projects/${projectId}/issues/${issueId}`;
}

export function buildIssueWorkspacePath(
  projectId: string,
  issueId: string,
  workspaceId: string
): string {
  return `/projects/${projectId}/issues/${issueId}/workspaces/${workspaceId}`;
}

export function buildWorkspaceCreatePath(
  projectId: string,
  draftId: string,
  issueId?: string | null
): string {
  if (issueId) {
    return `/projects/${projectId}/issues/${issueId}/workspaces/create/${draftId}`;
  }
  return `/projects/${projectId}/workspaces/create/${draftId}`;
}

export function buildIssueCreatePath(
  projectId: string,
  options?: IssueCreateRouteOptions
): string {
  const params = new URLSearchParams();
  if (options?.statusId) params.set('statusId', options.statusId);
  if (options?.priority) params.set('priority', options.priority);
  if (options?.assigneeIds?.length) {
    params.set('assignees', options.assigneeIds.join(','));
  }
  if (options?.parentIssueId)
    params.set('parentIssueId', options.parentIssueId);
  return withSearch(`/projects/${projectId}/issues/new`, params);
}

export function parseProjectSidebarRoute(
  pathname: string
): ProjectSidebarRouteState | null {
  const issueWorkspaceCreateMatch = pathname.match(
    /^\/projects\/([^/]+)\/issues\/([^/]+)\/workspaces\/create\/([^/]+)$/
  );
  if (issueWorkspaceCreateMatch) {
    return {
      type: 'workspace-create',
      projectId: issueWorkspaceCreateMatch[1],
      issueId: issueWorkspaceCreateMatch[2],
      draftId: issueWorkspaceCreateMatch[3],
    };
  }

  const workspaceCreateMatch = pathname.match(
    /^\/projects\/([^/]+)\/workspaces\/create\/([^/]+)$/
  );
  if (workspaceCreateMatch) {
    return {
      type: 'workspace-create',
      projectId: workspaceCreateMatch[1],
      issueId: null,
      draftId: workspaceCreateMatch[2],
    };
  }

  const issueWorkspaceMatch = pathname.match(
    /^\/projects\/([^/]+)\/issues\/([^/]+)\/workspaces\/([^/]+)$/
  );
  if (issueWorkspaceMatch) {
    return {
      type: 'issue-workspace',
      projectId: issueWorkspaceMatch[1],
      issueId: issueWorkspaceMatch[2],
      workspaceId: issueWorkspaceMatch[3],
    };
  }

  const issueCreateMatch = pathname.match(/^\/projects\/([^/]+)\/issues\/new$/);
  if (issueCreateMatch) {
    return {
      type: 'issue-create',
      projectId: issueCreateMatch[1],
    };
  }

  const issueMatch = pathname.match(/^\/projects\/([^/]+)\/issues\/([^/]+)$/);
  if (issueMatch) {
    return {
      type: 'issue',
      projectId: issueMatch[1],
      issueId: issueMatch[2],
    };
  }

  const projectMatch = pathname.match(/^\/projects\/([^/]+)$/);
  if (projectMatch) {
    return {
      type: 'closed',
      projectId: projectMatch[1],
    };
  }

  return null;
}
