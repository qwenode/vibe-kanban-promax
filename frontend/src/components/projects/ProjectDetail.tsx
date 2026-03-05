import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigateWithSearch } from '@/hooks';
import { Banner, Button, Card, Modal, Spin, Tag, Typography } from '@douyinfe/semi-ui';
import { projectsApi } from '@/lib/api';
import { useProjects } from '@/hooks/useProjects';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckSquare,
  Clock,
  Edit,
  Trash2,
} from 'lucide-react';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

export function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const { t } = useTranslation('projects');
  const navigate = useNavigateWithSearch();
  const { projectsById, isLoading, error: projectsError } = useProjects();
  const [deleteError, setDeleteError] = useState('');

  const project = projectsById[projectId] || null;

  const handleDelete = async () => {
    if (!project) return;
    Modal.warning({
      title: t('common:buttons.delete'),
      content: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      okType: 'danger',
      hasCancel: true,
      onOk: async () => {
        try {
          await projectsApi.delete(projectId);
          onBack();
        } catch (error) {
          console.error('Failed to delete project:', error);
          // @ts-expect-error it is type ApiError
          setDeleteError(error.message || t('errors.deleteFailed'));
          setTimeout(() => setDeleteError(''), 5000);
        }
      },
    });
  };

  const handleEditClick = () => {
    navigate(`/settings/projects?projectId=${projectId}`);
  };

  if (isLoading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <Spin />
      </div>
    );
  }

  if ((!project && !isLoading) || projectsError) {
    const errorMsg = projectsError
      ? projectsError.message
      : t('projectNotFound');
    return (
      <div className="space-y-4 py-12 px-4">
        <Button theme="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
        <Card>
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Project not found</h3>
            <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
            <Button className="mt-4" onClick={onBack}>
              Back to Projects
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-12 px-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <Button theme="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Project details and settings
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/local-projects/${projectId}/tasks`)}>
            <CheckSquare className="mr-2 h-4 w-4" />
            View Tasks
          </Button>
          <Button theme="outline" onClick={handleEditClick}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            theme="outline"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {deleteError && (
        <Banner
          type="danger"
          fullMode={false}
          icon={<AlertCircle className="h-4 w-4" />}
          description={deleteError}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="p-4 border-b">
            <Typography.Title heading={5} className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Project Information
            </Typography.Title>
          </div>
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Status
              </span>
              <Tag color="grey" type="light">Active</Tag>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span className="ml-2">
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="ml-2">
                  {new Date(project.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4 border-b">
            <Typography.Title heading={5}>Project Details</Typography.Title>
            <Typography.Text type="tertiary">
              Technical information about this project
            </Typography.Text>
          </div>
          <div className="space-y-3 p-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Project ID
              </h4>
              <code className="mt-1 block text-xs bg-muted p-2 rounded font-mono">
                {project.id}
              </code>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Created At
              </h4>
              <p className="mt-1 text-sm">
                {new Date(project.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Last Modified
              </h4>
              <p className="mt-1 text-sm">
                {new Date(project.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
