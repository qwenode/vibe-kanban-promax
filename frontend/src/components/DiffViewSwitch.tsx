import { Columns, FileText, Pilcrow, WrapText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button, Radio, Tooltip } from '@douyinfe/semi-ui';
import {
  useDiffViewMode,
  useDiffViewStore,
  useIgnoreWhitespaceDiff,
  useWrapTextDiff,
} from '@/stores/useDiffViewStore';

type Props = {
  className?: string;
};

export default function DiffViewSwitch({ className }: Props) {
  const { t } = useTranslation('tasks');
  const mode = useDiffViewMode();
  const setMode = useDiffViewStore((s) => s.setMode);
  const ignoreWhitespace = useIgnoreWhitespaceDiff();
  const setIgnoreWhitespace = useDiffViewStore((s) => s.setIgnoreWhitespace);
  const wrapText = useWrapTextDiff();
  const setWrapText = useDiffViewStore((s) => s.setWrapText);

  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <Radio.Group
        type="button"
        buttonSize="middle"
        value={mode ?? 'unified'}
        onChange={(e) => setMode(e.target.value as 'unified' | 'split')}
        aria-label="Diff view mode"
      >
        <Tooltip content={t('diff.viewModes.inline')} position="bottom">
          <Radio value="unified" aria-label="Inline view">
            <FileText className="h-4 w-4" />
          </Radio>
        </Tooltip>
        <Tooltip content={t('diff.viewModes.split')} position="bottom">
          <Radio value="split" aria-label="Split view">
            <Columns className="h-4 w-4" />
          </Radio>
        </Tooltip>
      </Radio.Group>

      <Tooltip content={t('diff.ignoreWhitespace')} position="bottom">
        <Button
          theme={ignoreWhitespace ? 'light' : 'borderless'}
          type={ignoreWhitespace ? 'primary' : 'tertiary'}
          icon={<Pilcrow className="h-4 w-4" />}
          aria-label={t('diff.ignoreWhitespace')}
          onClick={() => setIgnoreWhitespace(!ignoreWhitespace)}
        />
      </Tooltip>

      <Tooltip content={t('diff.wrapText', 'Wrap text')} position="bottom">
        <Button
          theme={wrapText ? 'light' : 'borderless'}
          type={wrapText ? 'primary' : 'tertiary'}
          icon={<WrapText className="h-4 w-4" />}
          aria-label={t('diff.wrapText', 'Wrap text')}
          onClick={() => setWrapText(!wrapText)}
        />
      </Tooltip>
    </div>
  );
}
