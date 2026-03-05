import * as React from 'react';
import Tag from '@douyinfe/semi-ui/lib/es/tag';
import type { TagProps } from '@douyinfe/semi-ui/lib/es/tag';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'> {
  variant?: BadgeVariant;
  size?: TagProps['size'];
}

function mapVariant(variant: BadgeVariant | undefined): Pick<TagProps, 'color' | 'type'> {
  switch (variant) {
    case 'secondary':
      return { color: 'grey', type: 'light' };
    case 'destructive':
      return { color: 'red', type: 'light' };
    case 'outline':
      return { color: 'grey', type: 'ghost' };
    case 'default':
    default:
      return { color: 'blue', type: 'solid' };
  }
}

function Badge({
  className,
  variant = 'default',
  size = 'default',
  children,
  ...props
}: BadgeProps) {
  const mapped = mapVariant(variant);
  return (
    <Tag
      {...(props as unknown as Record<string, unknown>)}
      size={size}
      color={mapped.color}
      type={mapped.type}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}

// Backwards-compat export
export const badgeVariants = () => '';

export { Badge };
