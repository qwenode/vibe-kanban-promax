import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { tagsApi } from '@/lib/api';
import { TagEditDialog } from '@/components/dialogs/tasks/TagEditDialog';
import { Button, Spin, Table } from '@douyinfe/semi-ui';
import type { Tag } from 'shared/types';
import { Modal } from '@douyinfe/semi-ui';

export function TagManager() {
  const { t } = useTranslation(['settings', 'common']);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tagsApi.list();
      setTags(data);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleOpenDialog = useCallback(
    async (tag?: Tag) => {
      try {
        const result = await TagEditDialog.show({
          tag: tag || null,
        });

        if (result === 'saved') {
          await fetchTags();
        }
      } catch (error) {
        // User cancelled - do nothing
      }
    },
    [fetchTags]
  );

  const handleDelete = useCallback(
    async (tag: Tag) => {
      const confirmed = await new Promise<boolean>((resolve) => {
        Modal.warning({
          title: t('common:buttons.delete', { defaultValue: 'Delete' }),
          content: t('settings.general.tags.manager.deleteConfirm', {
            tagName: tag.tag_name,
          }),
          okType: 'danger',
          hasCancel: true,
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
      if (!confirmed) return;

      try {
        await tagsApi.delete(tag.id);
        await fetchTags();
      } catch (err) {
        console.error('Failed to delete tag:', err);
      }
    },
    [fetchTags, t]
  );

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <Spin />
      </div>
    );
  }

  const columns = [
    {
      title: t('settings.general.tags.manager.table.tagName'),
      dataIndex: 'tagName',
      render: (_: unknown, tag: Tag) => (
        <span className="text-sm font-medium">@{tag.tag_name}</span>
      ),
    },
    {
      title: t('settings.general.tags.manager.table.content'),
      dataIndex: 'content',
      render: (_: unknown, tag: Tag) => (
        <div className="max-w-[400px] truncate text-sm" title={tag.content || ''}>
          {tag.content || <span className="text-muted-foreground">-</span>}
        </div>
      ),
    },
    {
      title: t('settings.general.tags.manager.table.actions'),
      dataIndex: 'actions',
      render: (_: unknown, tag: Tag) => (
        <div className="flex justify-end gap-1">
          <Button
            theme="borderless"
            icon={<PencilSimpleIcon className="h-4 w-4" />}
            aria-label="edit"
            onClick={() => handleOpenDialog(tag)}
            title={t('settings.general.tags.manager.actions.editTag')}
          />
          <Button
            theme="borderless"
            icon={<TrashIcon className="h-4 w-4" />}
            aria-label="delete"
            onClick={() => handleDelete(tag)}
            title={t('settings.general.tags.manager.actions.deleteTag')}
          />
        </div>
      ),
      align: 'right' as const,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {t('settings.general.tags.manager.title')}
        </h3>
        <Button theme="outline" onClick={() => handleOpenDialog()}>
          <PlusIcon className="mr-2 h-4 w-4" />
          {t('settings.general.tags.manager.addTag')}
        </Button>
      </div>

      {tags.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('settings.general.tags.manager.noTags')}
        </div>
      ) : (
        <div className="max-h-[400px] overflow-auto rounded-lg border">
          <Table
            dataSource={tags}
            columns={columns}
            rowKey="id"
            pagination={false}
            empty={t('settings.general.tags.manager.noTags')}
          />
        </div>
      )}
    </div>
  );
}
