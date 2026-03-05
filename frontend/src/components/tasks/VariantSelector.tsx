import { memo, useEffect, useState } from 'react';
import { ChevronDown, Settings2 } from 'lucide-react';
import { Button, Dropdown } from '@douyinfe/semi-ui';
import { cn } from '@/lib/utils';
import type { ExecutorConfig } from 'shared/types';

type Props = {
  currentProfile: ExecutorConfig | null;
  selectedVariant: string | null;
  onChange: (variant: string | null) => void;
  disabled?: boolean;
  className?: string;
};

const VariantSelectorInner = memo(
  ({ currentProfile, selectedVariant, onChange, disabled, className }: Props) => {
    // Bump-effect animation when cycling through variants
    const [isAnimating, setIsAnimating] = useState(false);
    useEffect(() => {
      if (!currentProfile) return;
      setIsAnimating(true);
      const t = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(t);
    }, [selectedVariant, currentProfile]);

    const hasVariants =
      currentProfile && Object.keys(currentProfile).length > 0;

    if (!currentProfile) return null;

    if (!hasVariants) {
      return (
        <Button
          theme="outline"
          size="small"
          className={cn(
            'h-10 w-24 px-2 flex items-center justify-between',
            className
          )}
          disabled
        />
      );
    }

    return (
      <Dropdown
        trigger="click"
        position="bottom"
        render={
          <Dropdown.Menu>
            {Object.entries(currentProfile).map(([variantLabel]) => (
              <Dropdown.Item
                key={variantLabel}
                onClick={() => onChange(variantLabel)}
              >
                {variantLabel}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        }
      >
        <Button
          type="secondary"
          size="small"
          className={cn(
            'px-2 flex items-center justify-between transition-all',
            isAnimating && 'scale-105 bg-accent',
            className
          )}
          disabled={disabled}
        >
          <Settings2 className="h-3 w-3 mr-1 flex-shrink-0" />
          <span className="text-xs truncate flex-1 text-left">
            {selectedVariant || 'DEFAULT'}
          </span>
          <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0" />
        </Button>
      </Dropdown>
    );
  }
);

VariantSelectorInner.displayName = 'VariantSelector';
export const VariantSelector = VariantSelectorInner;
