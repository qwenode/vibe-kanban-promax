import { useState, useRef, useEffect } from 'react';
import { ExternalLink, RefreshCw, Copy, Loader2, Pause, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Tooltip } from '@douyinfe/semi-ui';
import { NewCardHeader } from '@/components/ui/new-card';

interface PreviewToolbarProps {
  mode: 'noServer' | 'error' | 'ready';
  url?: string;
  onRefresh: () => void;
  onCopyUrl: () => void;
  onStop: () => void;
  isStopping?: boolean;
  customUrl: string | null;
  detectedUrl: string | undefined;
  onUrlChange: (url: string | null) => void;
}

export function PreviewToolbar({
  mode,
  url,
  onRefresh,
  onCopyUrl,
  onStop,
  isStopping,
  customUrl,
  detectedUrl,
  onUrlChange,
}: PreviewToolbarProps) {
  const { t } = useTranslation('tasks');
  const [isEditing, setIsEditing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setUrlInput(url ?? '');
    setIsEditing(true);
  };

  const handleSubmit = () => {
    const trimmed = urlInput.trim();
    if (!trimmed || trimmed === detectedUrl) {
      // Empty input or detected URL: reset to detected
      onUrlChange(null);
    } else {
      onUrlChange(trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleClearCustomUrl = () => {
    onUrlChange(null);
  };

  const actions =
    mode !== 'noServer' ? (
      <>
        <Tooltip content={t('preview.toolbar.refresh')}>
          <Button
            theme="borderless"
            aria-label={t('preview.toolbar.refresh')}
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content={t('preview.toolbar.copyUrl')}>
          <Button
            theme="borderless"
            aria-label={t('preview.toolbar.copyUrl')}
            onClick={onCopyUrl}
            disabled={!url}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content={t('preview.toolbar.openInTab')}>
          <Button
            theme="borderless"
            aria-label={t('preview.toolbar.openInTab')}
            disabled={!url}
            onClick={() => {
              if (url) window.open(url, '_blank', 'noopener,noreferrer');
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Tooltip>

        <div className="h-4 w-px bg-border" />

        <Tooltip content={t('preview.toolbar.stopDevServer')}>
          <Button
            theme="borderless"
            aria-label={t('preview.toolbar.stopDevServer')}
            onClick={onStop}
            disabled={isStopping}
          >
            {isStopping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pause className="h-4 w-4 text-destructive" />
            )}
          </Button>
        </Tooltip>
      </>
    ) : undefined;

  return (
    <NewCardHeader className="shrink-0" actions={actions}>
      <div className="flex items-center gap-2 min-w-0">
        {isEditing ? (
          <Input
            ref={inputRef}
            type="text"
            value={urlInput}
            onChange={(value) => setUrlInput(value)}
            onBlur={handleSubmit}
            onKeyDown={handleKeyDown}
            className="h-7 text-sm font-mono flex-1"
            placeholder="http://localhost:3000"
          />
        ) : (
          <>
            <button
              onClick={handleStartEdit}
              className="text-sm text-muted-foreground font-mono truncate hover:text-foreground transition-colors cursor-text text-left"
              aria-live="polite"
              title={t('preview.toolbar.clickToEdit')}
            >
              {url || <Loader2 className="h-4 w-4 animate-spin" />}
            </button>
            {customUrl !== null && (
              <Tooltip content={t('preview.toolbar.resetUrl')}>
                <Button
                  theme="borderless"
                  size="small"
                  onClick={handleClearCustomUrl}
                  className="h-5 w-5 p-0 shrink-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Tooltip>
            )}
          </>
        )}
      </div>
    </NewCardHeader>
  );
}
