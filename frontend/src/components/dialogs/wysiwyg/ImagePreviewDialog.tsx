import { useState } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/lib/modals';
import { formatFileSize } from '@/lib/utils';
import { Modal, Spin, Typography } from '@douyinfe/semi-ui';

export interface ImagePreviewDialogProps {
  imageUrl: string;
  altText: string;
  fileName?: string;
  format?: string;
  sizeBytes?: bigint | null;
}

const ImagePreviewDialogImpl = NiceModal.create<ImagePreviewDialogProps>(
  (props) => {
    const modal = useModal();
    const { imageUrl, altText, fileName, format, sizeBytes } = props;
    const [imageLoaded, setImageLoaded] = useState(false);

    const handleClose = () => {
      modal.hide();
    };

    // Build metadata string
    const metadataParts: string[] = [];
    if (format) {
      metadataParts.push(format.toUpperCase());
    }
    const sizeStr = formatFileSize(sizeBytes);
    if (sizeStr) {
      metadataParts.push(sizeStr);
    }
    const metadataLine = metadataParts.join(' · ');

    return (
      <Modal
        visible={modal.visible}
        onCancel={handleClose}
        footer={null}
        width={896}
        bodyStyle={{ padding: 0 }}
      >
        <div className="overflow-hidden">
          {fileName && (
            <div className="px-4 pt-4 pb-0">
              <Typography.Title heading={5} className="truncate">
                {fileName}
              </Typography.Title>
            </div>
          )}
          <div className="relative flex items-center justify-center min-h-[200px]">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spin size="large" />
              </div>
            )}
            <img
              src={imageUrl}
              alt={altText}
              className={`max-w-full max-h-[70vh] object-contain ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
          {metadataLine && (
            <div className="px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">{metadataLine}</p>
            </div>
          )}
        </div>
      </Modal>
    );
  }
);

export const ImagePreviewDialog = defineModal<ImagePreviewDialogProps, void>(
  ImagePreviewDialogImpl
);
