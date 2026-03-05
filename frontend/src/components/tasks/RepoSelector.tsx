import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, Typography } from '@douyinfe/semi-ui';
import type { Repo } from 'shared/types';

type Props = {
  repos: Repo[];
  selectedRepoId: string | null;
  onRepoSelect: (repoId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

function RepoSelector({
  repos,
  selectedRepoId,
  onRepoSelect,
  placeholder,
  className,
  disabled = false,
}: Props) {
  const { t } = useTranslation(['tasks']);

  const effectivePlaceholder =
    placeholder ?? t('repos.selector.placeholder', 'Select repository');

  const optionList = useMemo(
    () =>
      repos.map((repo) => ({
        value: repo.id,
        label: repo.display_name,
      })),
    [repos]
  );

  return (
    <Select
      className={className}
      style={{ width: '100%' }}
      disabled={disabled}
      value={selectedRepoId ?? undefined}
      placeholder={effectivePlaceholder}
      optionList={optionList}
      emptyContent={
        <Typography.Text type="tertiary">
          {t('repos.selector.empty', 'No repositories available')}
        </Typography.Text>
      }
      onChange={(value) => {
        if (typeof value === 'string') {
          onRepoSelect(value);
        }
      }}
    />
  );
}

export default RepoSelector;
