import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, Tag, Typography } from '@douyinfe/semi-ui';
import type { GitBranch } from 'shared/types';

type Props = {
  branches: GitBranch[];
  selectedBranch: string | null;
  onBranchSelect: (branch: string) => void;
  placeholder?: string;
  className?: string;
  excludeCurrentBranch?: boolean;
  disabledTooltip?: string;
};

function BranchSelector({
  branches,
  selectedBranch,
  onBranchSelect,
  placeholder,
  className,
  excludeCurrentBranch = false,
  disabledTooltip,
}: Props) {
  const { t } = useTranslation(['common']);
  void disabledTooltip;

  const effectivePlaceholder = placeholder ?? t('branchSelector.placeholder');
  const optionList = useMemo(
    () =>
      branches.map((branch) => ({
        value: branch.name,
        disabled: excludeCurrentBranch && branch.is_current,
        label: (
          <div className="flex items-center justify-between gap-2">
            <Typography.Text>{branch.name}</Typography.Text>
            <div className="flex items-center gap-1">
              {branch.is_current ? (
                <Tag type="light" color="grey">
                  {t('branchSelector.badges.current')}
                </Tag>
              ) : null}
              {branch.is_remote ? (
                <Tag type="light" color="blue">
                  {t('branchSelector.badges.remote')}
                </Tag>
              ) : null}
            </div>
          </div>
        ),
      })),
    [branches, excludeCurrentBranch, t]
  );

  return (
    <Select
      className={className}
      style={{ width: '100%' }}
      filter
      value={selectedBranch ?? undefined}
      placeholder={effectivePlaceholder}
      optionList={optionList}
      emptyContent={
        <Typography.Text type="tertiary">{t('branchSelector.empty')}</Typography.Text>
      }
      onChange={(value) => {
        if (typeof value === 'string') {
          onBranchSelect(value);
        }
      }}
    />
  );
}

export default BranchSelector;
