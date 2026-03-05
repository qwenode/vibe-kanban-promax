import * as React from 'react';

import { cn } from '@/lib/utils';
import { Card as SemiCard, Typography } from '@douyinfe/semi-ui';
import type { CardProps as SemiCardProps } from '@douyinfe/semi-ui/lib/es/card';

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Semi Card prop.
   * Kept explicit because `bordered` is not a valid HTML attribute.
   */
  bordered?: boolean;
  /**
   * Semi Card prop passthrough (best-effort).
   * Lets callsites pass Semi Card props without losing DOM attributes typing.
   */
  bodyStyle?: SemiCardProps['bodyStyle'];
  headerStyle?: SemiCardProps['headerStyle'];
  shadows?: SemiCardProps['shadows'];
  headerLine?: SemiCardProps['headerLine'];
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, bordered, ...props }, ref) => (
    <SemiCard
      {...(props as unknown as SemiCardProps)}
      ref={ref as never}
      bordered={bordered ?? true}
      className={cn(className)}
    >
      {children}
    </SemiCard>
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-1', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Typography.Title
    ref={ref as never}
    heading={5}
    className={cn(className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Typography.Text
    ref={ref as never}
    type="tertiary"
    className={cn(className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn(className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
