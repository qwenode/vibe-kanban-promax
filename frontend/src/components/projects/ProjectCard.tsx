import { Button, Card, Dropdown, Modal, Typography } from '@douyinfe/semi-ui';
import {
  Calendar,
  Edit,
  ExternalLink,
  FolderOpen,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { Project } from 'shared/types';
import { useEffect, type MouseEvent } from 'react';
import { useOpenProjectInEditor } from '@/hooks/useOpenProjectInEditor';
import { useNavigateWithSearch, useProjectRepos } from '@/hooks';
import { projectsApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';

type Props = {
  project: Project;
  isFocused: boolean;
  setError: (error: string) => void;
  onEdit: (project: Project) => void;
};

function ProjectCard({ project, isFocused, setError, onEdit }: Props) {
  const navigate = useNavigateWithSearch();
  const handleOpenInEditor = useOpenProjectInEditor(project);
  const { t } = useTranslation('projects');
  const cardDomId = `project-card-${project.id}`;

  const { data: repos } = useProjectRepos(project.id);
  const isSingleRepoProject = repos?.length === 1;

  useEffect(() => {
    const cardEl = document.getElementById(cardDomId);
    if (isFocused && cardEl) {
      cardEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      cardEl.focus();
    }
  }, [cardDomId, isFocused]);

  const handleDelete = async (id: string, name: string) => {
    Modal.warning({
      title: t('common:buttons.delete'),
      content: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      okType: 'danger',
      hasCancel: true,
      onOk: async () => {
        try {
          await projectsApi.delete(id);
        } catch (error) {
          console.error('Failed to delete project:', error);
          setError('Failed to delete project');
        }
      },
    });
  };

  const handleEdit = (project: Project) => {
    onEdit(project);
  };

  const handleOpenInIDE = () => {
    handleOpenInEditor();
  };

  return (
    <div
      id={cardDomId}
      className="cursor-pointer outline-none transition-shadow hover:shadow-md focus:ring-2 focus:ring-primary"
      onClick={() => navigate(`/local-projects/${project.id}/tasks`)}
      tabIndex={isFocused ? 0 : -1}
    >
      <Card>
        <div className="p-4">
        <div className="flex items-start justify-between">
          <Typography.Title heading={5} className="text-lg !mb-0">
            {project.name}
          </Typography.Title>
          <div className="flex items-center gap-2">
            <Dropdown
              trigger="click"
              position="bottomRight"
              render={
                <Dropdown.Menu>
                  <Dropdown.Item
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/local-projects/${project.id}`);
                    }}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t('viewProject')}
                  </Dropdown.Item>
                  {isSingleRepoProject && (
                    <Dropdown.Item
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenInIDE();
                      }}
                    >
                      <FolderOpen className="mr-2 h-4 w-4" />
                      {t('openInIDE')}
                    </Dropdown.Item>
                  )}
                  <Dropdown.Item
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(project);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {t('common:buttons.edit')}
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project.id, project.name);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('common:buttons.delete')}
                  </Dropdown.Item>
                </Dropdown.Menu>
              }
            >
              <Button
                theme="borderless"
                noHorizontalPadding
                onClick={(e: MouseEvent) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </Dropdown>
          </div>
        </div>
        <Typography.Text type="tertiary" className="flex items-center">
          <Calendar className="mr-1 h-3 w-3" />
          {t('createdDate', {
            date: new Date(project.created_at).toLocaleDateString(),
          })}
        </Typography.Text>
        </div>
      </Card>
      </div>
    
  );
}

export default ProjectCard;
