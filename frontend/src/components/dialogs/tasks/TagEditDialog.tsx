import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Banner, Button, Input, Modal, Typography } from '@douyinfe/semi-ui';
import TextArea from '@douyinfe/semi-ui/lib/es/input/textarea';
import { tagsApi } from '@/lib/api';
import type { Tag, CreateTag, UpdateTag } from 'shared/types';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal, getErrorMessage } from '@/lib/modals';

export interface TagEditDialogProps {
  tag?: Tag | null; // null for create mode
}

export type TagEditResult = 'saved' | 'canceled';

const TagEditDialogImpl = NiceModal.create<TagEditDialogProps>(({ tag }) => {
  const modal = useModal();
  const { t } = useTranslation('settings');
  const [formData, setFormData] = useState({
    tag_name: '',
    content: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagNameError, setTagNameError] = useState<string | null>(null);

  const isEditMode = Boolean(tag);

  useEffect(() => {
    if (tag) {
      setFormData({
        tag_name: tag.tag_name,
        content: tag.content,
      });
    } else {
      setFormData({
        tag_name: '',
        content: '',
      });
    }
    setError(null);
    setTagNameError(null);
  }, [tag]);

  const handleSave = async () => {
    if (!formData.tag_name.trim()) {
      setError(t('settings.general.tags.dialog.errors.nameRequired'));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEditMode && tag) {
        const updateData: UpdateTag = {
          tag_name: formData.tag_name,
          content: formData.content || null, // null means "don't update"
        };
        await tagsApi.update(tag.id, updateData);
      } else {
        const createData: CreateTag = {
          tag_name: formData.tag_name,
          content: formData.content,
        };
        await tagsApi.create(createData);
      }

      modal.resolve('saved' as TagEditResult);
      modal.hide();
    } catch (err: unknown) {
      setError(
        getErrorMessage(err) ||
          t('settings.general.tags.dialog.errors.saveFailed')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    modal.resolve('canceled' as TagEditResult);
    modal.hide();
  };

  return (
    <Modal
      visible={modal.visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
    >
      <div className="space-y-4">
        <Typography.Title heading={5}>
            {isEditMode
              ? t('settings.general.tags.dialog.editTitle')
              : t('settings.general.tags.dialog.createTitle')}
        </Typography.Title>
        <div className="space-y-4 py-4">
          <div>
            <Typography.Text strong>
              {t('settings.general.tags.dialog.tagName.label')}{' '}
              <Typography.Text type="danger">
                {t('settings.general.tags.dialog.tagName.required')}
              </Typography.Text>
            </Typography.Text>
            <Typography.Text type="tertiary" style={{ fontSize: 12 }}>
              {t('settings.general.tags.dialog.tagName.hint', {
                tagName: formData.tag_name || 'tag_name',
              })}
            </Typography.Text>
            <Input
              id="tag-name"
              value={formData.tag_name}
              onChange={(value) => {
                const nextValue = String(value);
                setFormData({ ...formData, tag_name: nextValue });

                // Validate in real-time for spaces
                if (nextValue.includes(' ')) {
                  setTagNameError(
                    t('settings.general.tags.dialog.tagName.error')
                  );
                } else {
                  setTagNameError(null);
                }
              }}
              placeholder={t(
                'settings.general.tags.dialog.tagName.placeholder'
              )}
              disabled={saving}
              autoFocus
              validateStatus={tagNameError ? 'error' : 'default'}
            />
            {tagNameError && (
              <Typography.Text type="danger">{tagNameError}</Typography.Text>
            )}
          </div>
          <div>
            <Typography.Text strong>
              {t('settings.general.tags.dialog.content.label')}{' '}
              <Typography.Text type="danger">
                {t('settings.general.tags.dialog.content.required')}
              </Typography.Text>
            </Typography.Text>
            <Typography.Text type="tertiary" style={{ fontSize: 12 }}>
              {t('settings.general.tags.dialog.content.hint', {
                tagName: formData.tag_name || 'tag_name',
              })}
            </Typography.Text>
            <TextArea
              id="tag-content"
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: String(value) })}
              placeholder={t(
                'settings.general.tags.dialog.content.placeholder'
              )}
              rows={6}
              disabled={saving}
            />
          </div>
          {error && <Banner type="danger" fullMode={false} description={error} />}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button theme="outline" onClick={handleCancel} disabled={saving}>
            {t('settings.general.tags.dialog.buttons.cancel')}
          </Button>
          <Button
            type="primary"
            onClick={handleSave}
            disabled={saving || !!tagNameError || !formData.content.trim()}
            loading={saving}
          >
            {isEditMode
              ? t('settings.general.tags.dialog.buttons.update')
              : t('settings.general.tags.dialog.buttons.create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export const TagEditDialog = defineModal<TagEditDialogProps, TagEditResult>(
  TagEditDialogImpl
);
