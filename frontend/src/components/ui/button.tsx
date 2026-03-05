import * as React from 'react';
import { Button as SemiButton } from '@douyinfe/semi-ui';
import type { ButtonProps as SemiButtonProps } from '@douyinfe/semi-ui/lib/es/button';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'icon';

export type ButtonSize = 'default' | 'xs' | 'sm' | 'lg' | 'icon';

export interface ButtonProps
  extends Omit<SemiButtonProps, 'type' | 'theme' | 'size' | 'children' | 'htmlType'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  children?: React.ReactNode;
  /**
   * Backwards-compat with HTMLButtonElement's `type` attribute.
   * Semi uses `htmlType`, but many callsites pass `type="button"`.
   */
  type?: 'button' | 'submit' | 'reset';
  htmlType?: 'button' | 'submit' | 'reset';
}

function mapVariant(variant: ButtonVariant | undefined): {
  semiType?: SemiButtonProps['type'];
  theme?: SemiButtonProps['theme'];
} {
  switch (variant) {
    case 'destructive':
      return { semiType: 'danger', theme: 'light' };
    case 'outline':
      return { theme: 'outline' };
    case 'secondary':
      return { semiType: 'secondary', theme: 'solid' };
    case 'ghost':
      return { theme: 'borderless' };
    case 'link':
      return { theme: 'borderless' };
    case 'icon':
      return { theme: 'borderless' };
    case 'default':
    default:
      return { semiType: 'primary', theme: 'solid' };
  }
}

function mapSize(size: ButtonSize | undefined): SemiButtonProps['size'] {
  switch (size) {
    case 'xs':
    case 'sm':
      return 'default';
    case 'lg':
      return 'large';
    case 'icon':
    case 'default':
    default:
      return 'default';
  }
}

const Button = React.forwardRef<HTMLElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      asChild,
      children,
      type,
      htmlType,
      ...props
    },
    ref
  ) => {
    const mapped = mapVariant(variant);
    const semiSize = mapSize(size);

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        ...props,
        className: cn(className, child.props?.className),
      });
    }

    return (
      <SemiButton
        {...(props as SemiButtonProps)}
        ref={ref as never}
        type={mapped.semiType}
        theme={mapped.theme}
        size={semiSize}
        noHorizontalPadding={
          size === 'icon' ? true : (props as SemiButtonProps).noHorizontalPadding
        }
        htmlType={htmlType ?? type}
        className={cn(className)}
      >
        {children}
      </SemiButton>
    );
  }
);
Button.displayName = 'Button';

// Backwards-compat export (unused in repo but kept to avoid churn)
export const buttonVariants = () => '';

export { Button };
