import * as React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project } from 'shared/types';
import { Input as SemiInput } from '@douyinfe/semi-ui';

interface SearchBarProps {
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  onClear?: () => void;
  project: Project | null;
}

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, value = '', onChange, disabled = false, project }, ref) => {
    if (disabled) {
      return null;
    }

    return (
      <div className={cn('w-64 sm:w-72', className)}>
        <SemiInput
          ref={ref as never}
          value={value}
          onChange={(next) => onChange?.(next)}
          disabled={disabled}
          placeholder={project ? `Search ${project.name}...` : 'Search...'}
          prefix={<Search size={14} />}
          showClear
        />
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';
