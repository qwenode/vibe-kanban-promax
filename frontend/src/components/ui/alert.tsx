import * as React from 'react';
import Banner from '@douyinfe/semi-ui/lib/es/banner';
import type { BannerProps } from '@douyinfe/semi-ui/lib/es/banner';

export type AlertVariant = 'default' | 'destructive' | 'success';

type AlertProps = Omit<BannerProps, 'type' | 'title' | 'description' | 'icon'> & {
  variant?: AlertVariant;
};

const AlertTitle = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => (className ? <div className={className}>{children}</div> : <>{children}</>);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => (className ? <div className={className}>{children}</div> : <>{children}</>);
AlertDescription.displayName = 'AlertDescription';

function mapVariant(variant: AlertVariant | undefined): BannerProps['type'] {
  switch (variant) {
    case 'destructive':
      return 'danger';
    case 'success':
      return 'success';
    case 'default':
    default:
      return 'info';
  }
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = 'default', children, ...props }, ref) => {
    const nodes = React.Children.toArray(children) as React.ReactNode[];

    let icon: React.ReactNode | undefined;
    let title: React.ReactNode | undefined;
    let description: React.ReactNode | undefined;

    for (const node of nodes) {
      if (!React.isValidElement(node)) continue;

      if (node.type === AlertTitle) {
        title = node.props.children;
        continue;
      }
      if (node.type === AlertDescription) {
        description = node.props.children;
        continue;
      }
    }

    const nonMetaChildren = nodes.filter((node) => {
      if (!React.isValidElement(node)) return Boolean(node);
      return node.type !== AlertTitle && node.type !== AlertDescription;
    });

    // If the first leftover child is an element, treat it as an icon
    if (nonMetaChildren.length > 0 && React.isValidElement(nonMetaChildren[0])) {
      icon = nonMetaChildren[0];
    }

    // If no explicit title/description, fall back to remaining children
    if (title === undefined && description === undefined) {
      const rest = icon ? nonMetaChildren.slice(1) : nonMetaChildren;
      description = rest.length ? <>{rest}</> : undefined;
    }

    return (
      <Banner
        {...props}
        // Banner uses a div root
        ref={ref as never}
        type={mapVariant(variant)}
        icon={icon}
        title={title}
        description={description}
      />
    );
  }
);
Alert.displayName = 'Alert';

export { Alert, AlertTitle, AlertDescription };
