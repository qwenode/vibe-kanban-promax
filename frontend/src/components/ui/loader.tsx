import React from 'react';
import { Spin, Typography } from '@douyinfe/semi-ui';

interface LoaderProps {
  message?: string | React.ReactElement;
  size?: number;
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  message,
  size = 32,
  className = '',
}) => (
  <div
    className={`flex flex-col items-center justify-center gap-2 ${className}`}
  >
    <Spin
      size={size >= 32 ? 'large' : 'middle'}
      wrapperClassName="inline-flex"
    />
    {!!message && (
      <Typography.Text type="tertiary" style={{ textAlign: 'center' }}>
        {message}
      </Typography.Text>
    )}
  </div>
);
