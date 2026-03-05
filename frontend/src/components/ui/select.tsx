import * as React from 'react';
import { Select as SemiSelect } from '@douyinfe/semi-ui';
import type { SelectProps as SemiSelectProps, OptionProps } from '@douyinfe/semi-ui/lib/es/select';
import { cn } from '@/lib/utils';

type MarkerProps = { children?: React.ReactNode; className?: string; id?: string };

export function SelectValue({ children }: { placeholder?: React.ReactNode; children?: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectTrigger({ children }: MarkerProps) {
  return <>{children}</>;
}

export function SelectContent({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectItem({
  children,
}: {
  value: string;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return <>{children}</>;
}

export const SelectGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SelectLabel = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SelectSeparator = () => null;
export const SelectScrollUpButton = () => null;
export const SelectScrollDownButton = () => null;

interface ShadcnLikeSelectProps
  extends Omit<
    SemiSelectProps,
    'value' | 'defaultValue' | 'onChange' | 'optionList' | 'children'
  > {
  value?: string;
  defaultValue?: string;
  /**
   * Use method signature for bivariant callback compatibility with
   * string enums at callsites (ThemeMode, EditorType, etc).
   */
  onValueChange?(value: string): void;
  disabled?: boolean;
  // Compatibility props from Radix/shadcn Select
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function Select({
  value,
  defaultValue,
  onValueChange,
  disabled,
  children,
  className,
  ...props
}: ShadcnLikeSelectProps) {
  const nodes = React.Children.toArray(children) as React.ReactElement[];
  const triggerEl = nodes.find((n) => React.isValidElement(n) && n.type === SelectTrigger);
  const contentEl = nodes.find((n) => React.isValidElement(n) && n.type === SelectContent);

  const triggerProps = (triggerEl?.props ?? {}) as { className?: string; id?: string };
  const placeholderEl = React.Children.toArray(triggerEl?.props?.children ?? []).find(
    (n) => React.isValidElement(n) && n.type === SelectValue
  ) as React.ReactElement<{ placeholder?: React.ReactNode }> | undefined;
  const placeholder = placeholderEl?.props?.placeholder;

  const optionNodes = React.Children.toArray(contentEl?.props?.children ?? []).filter((n) =>
    React.isValidElement(n)
  ) as React.ReactElement[];

  const optionList: OptionProps[] = optionNodes
    .filter((n) => n.type === SelectItem)
    .map((n) => {
      const p = n.props as unknown as {
        value?: unknown;
        disabled?: unknown;
        children?: React.ReactNode;
      };
      const rawValue = p.value;
      const valueForSemi =
        typeof rawValue === 'string' || typeof rawValue === 'number'
          ? rawValue
          : String(rawValue ?? '');
      return {
        value: valueForSemi,
        label: p.children,
        disabled: Boolean(p.disabled),
      };
    });

  return (
    <SemiSelect
      {...props}
      id={triggerProps.id ?? (props as unknown as { id?: string }).id}
      disabled={disabled ?? (props as unknown as { disabled?: boolean }).disabled}
      value={value as SemiSelectProps['value']}
      defaultValue={defaultValue as SemiSelectProps['defaultValue']}
      placeholder={placeholder as unknown as SemiSelectProps['placeholder']}
      optionList={optionList}
      onChange={(v) => onValueChange?.(String(v))}
      className={cn(triggerProps.className, className)}
    />
  );
}
