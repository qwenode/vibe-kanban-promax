import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Banner,
  Button,
  Card,
  Input,
  Modal,
  Spin,
  Typography,
} from '@douyinfe/semi-ui';
import {
  ChevronUp,
  File,
  Folder,
  FolderOpen,
  Home,
  Search,
} from 'lucide-react';
import { fileSystemApi } from '@/lib/api';
import { DirectoryEntry, DirectoryListResponse } from 'shared/types';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/lib/modals';

export interface FolderPickerDialogProps {
  value?: string;
  title?: string;
  description?: string;
}

const FolderPickerDialogImpl = NiceModal.create<FolderPickerDialogProps>(
  ({
    value = '',
    title = 'Select Folder',
    description = 'Choose a folder for your project',
  }) => {
    const modal = useModal();
    const { t } = useTranslation('common');
    const [currentPath, setCurrentPath] = useState<string>('');
    const [entries, setEntries] = useState<DirectoryEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [manualPath, setManualPath] = useState(value);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEntries = useMemo(() => {
      if (!searchTerm.trim()) return entries;
      return entries.filter((entry) =>
        entry.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [entries, searchTerm]);

    useEffect(() => {
      if (modal.visible) {
        setManualPath(value);
        loadDirectory();
      }
    }, [modal.visible, value]);

    const loadDirectory = async (path?: string) => {
      setLoading(true);
      setError('');

      try {
        const result: DirectoryListResponse = await fileSystemApi.list(path);

        // Ensure result exists and has the expected structure
        if (!result || typeof result !== 'object') {
          throw new Error('Invalid response from file system API');
        }
        // Safely access entries, ensuring it's an array
        const entries = Array.isArray(result.entries) ? result.entries : [];
        setEntries(entries);
        const newPath = result.current_path || '';
        setCurrentPath(newPath);
        // Update manual path if we have a specific path (not for initial home directory load)
        if (path) {
          setManualPath(newPath);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load directory'
        );
        // Reset entries to empty array on error
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    const handleFolderClick = (entry: DirectoryEntry) => {
      if (entry.is_directory) {
        setSearchTerm('');
        loadDirectory(entry.path);
        setManualPath(entry.path); // Auto-populate the manual path field
      }
    };

    const handleParentDirectory = () => {
      const parentPath = currentPath.split('/').slice(0, -1).join('/');
      const newPath = parentPath || '/';
      loadDirectory(newPath);
      setManualPath(newPath);
    };

    const handleHomeDirectory = () => {
      loadDirectory();
      // Don't set manual path here since home directory path varies by system
    };

    const handleManualPathChange = (value: string) => {
      setManualPath(value);
    };

    const handleManualPathSubmit = () => {
      loadDirectory(manualPath);
    };

    const handleSelectCurrent = () => {
      const selectedPath = manualPath || currentPath;
      modal.resolve(selectedPath);
      modal.hide();
    };

    const handleSelectManual = () => {
      modal.resolve(manualPath);
      modal.hide();
    };

    const handleCancel = () => {
      modal.resolve(null);
      modal.hide();
    };

    return (
      <div className="fixed inset-0 z-[10000] pointer-events-none [&>*]:pointer-events-auto">
        <Modal
          visible={modal.visible}
          onCancel={handleCancel}
          footer={null}
          width={600}
          bodyStyle={{ height: 700, display: 'flex', flexDirection: 'column' }}
        >
          <div className="space-y-1 pb-2">
            <Typography.Title heading={5}>{title}</Typography.Title>
            <Typography.Text type="tertiary">{description}</Typography.Text>
          </div>

            <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
              {/* Legend */}
              <Typography.Text type="tertiary">
                {t('folderPicker.legend')}
              </Typography.Text>

              {/* Manual path input */}
              <div className="space-y-2">
                <Typography.Text strong>
                  {t('folderPicker.manualPathLabel')}
                </Typography.Text>
                <div className="flex space-x-2 min-w-0">
                  <Input
                    value={manualPath}
                    onChange={handleManualPathChange}
                    placeholder="/path/to/your/project"
                  />
                  <Button
                    onClick={handleManualPathSubmit}
                    theme="outline"
                  >
                    {t('folderPicker.go')}
                  </Button>
                </div>
              </div>

              {/* Search input */}
              <div className="space-y-2">
                <Typography.Text strong>
                  {t('folderPicker.searchLabel')}
                </Typography.Text>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(value) => setSearchTerm(value)}
                    placeholder="Filter folders and files..."
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center space-x-2 min-w-0">
                <Button
                  onClick={handleHomeDirectory}
                  theme="outline"
                  icon={<Home className="h-4 w-4" />}
                >
                </Button>
                <Button
                  onClick={handleParentDirectory}
                  theme="outline"
                  disabled={!currentPath || currentPath === '/'}
                  icon={<ChevronUp className="h-4 w-4" />}
                >
                </Button>
                <Typography.Text type="tertiary" ellipsis style={{ flex: 1 }}>
                  {currentPath || 'Home'}
                </Typography.Text>
                <Button
                  onClick={handleSelectCurrent}
                  theme="outline"
                  disabled={!currentPath}
                >
                  {t('folderPicker.selectCurrent')}
                </Button>
              </div>

              {/* Directory listing */}
              <Card bordered className="flex-1 overflow-auto">
                {loading ? (
                  <div className="p-4 flex items-center justify-center gap-2">
                    <Spin />
                    <Typography.Text type="tertiary">Loading...</Typography.Text>
                  </div>
                ) : error ? (
                  <Banner type="danger" fullMode={false} description={error} />
                ) : filteredEntries.length === 0 ? (
                  <div className="p-4 text-center">
                    <Typography.Text type="tertiary">
                    {searchTerm.trim()
                      ? 'No matches found'
                      : 'No folders found'}
                    </Typography.Text>
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredEntries.map((entry, index) => (
                      <div
                        key={index}
                        className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-accent ${
                          !entry.is_directory
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                        onClick={() =>
                          entry.is_directory && handleFolderClick(entry)
                        }
                        title={entry.name} // Show full name on hover
                      >
                        {entry.is_directory ? (
                          entry.is_git_repo ? (
                            <FolderOpen className="h-4 w-4 text-success flex-shrink-0" />
                          ) : (
                            <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          )
                        ) : (
                          <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        )}
                        <Typography.Text style={{ flex: 1 }} ellipsis>
                          {entry.name}
                        </Typography.Text>
                        {entry.is_git_repo && (
                          <Typography.Text type="success">
                            {t('folderPicker.gitRepo')}
                          </Typography.Text>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <Button htmlType="button" theme="outline" onClick={handleCancel}>
                {t('buttons.cancel')}
              </Button>
              <Button
                type="primary"
                onClick={handleSelectManual}
                disabled={!manualPath.trim()}
              >
                {t('folderPicker.selectPath')}
              </Button>
            </div>
        </Modal>
      </div>
    );
  }
);

export const FolderPickerDialog = defineModal<
  FolderPickerDialogProps,
  string | null
>(FolderPickerDialogImpl);
