import * as React from 'react';
import { Tooltip as SemiTooltip } from '@douyinfe/semi-ui';

type TooltipTriggerProps = {
  asChild?: boolean;
  children?: React.ReactNode;
};
type TooltipContentProps = {
  children?: React.ReactNode;
  className?: string;
  side?: string;
  align?: string;
};

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function TooltipTrigger({ children }: TooltipTriggerProps) {
  return <>{children}</>;
}

export function TooltipContent({ children }: TooltipContentProps) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  const nodes = React.Children.toArray(children) as React.ReactElement[];
  const triggerEl = nodes.find((n) => React.isValidElement(n) && n.type === TooltipTrigger);
  const contentEl = nodes.find((n) => React.isValidElement(n) && n.type === TooltipContent);

  const trigger = triggerEl?.props?.children ?? null;
  const content = contentEl?.props?.children ?? null;

  if (!trigger) return null;
  if (!content) return <>{trigger}</>;

  return <SemiTooltip content={content}>{trigger}</SemiTooltip>;
}
