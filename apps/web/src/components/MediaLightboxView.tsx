import { useMediaLightbox } from '@mediaforge/ui-react';
import { hostProps } from '../lib/hostProps';
import type { AppMediaItem } from '../lib/mapMedia';

interface MediaLightboxViewProps {
  open: boolean;
  items: AppMediaItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  onDownload: (item: AppMediaItem) => void;
}

export function MediaLightboxView(props: MediaLightboxViewProps) {
  const { open, items, index, onClose, onIndexChange, onDownload } = props;

  const lightbox = useMediaLightbox({
    open,
    items,
    index,
    onClose,
    onIndexChange,
  });

  if (!open || !lightbox.currentItem) {
    return null;
  }

  const item = lightbox.currentItem as AppMediaItem;

  return (
    <div className="lightbox-root">
      <div
        className="lightbox-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div {...hostProps(lightbox.getDialogProps({ className: 'lightbox-dialog' }))}>
        <div className="lightbox-toolbar">
          <button
            {...hostProps(lightbox.getCloseButtonProps({ className: 'button button-ghost' }))}
          >
            Close
          </button>
          <div className="lightbox-nav">
            <button
              {...hostProps(
                lightbox.getPreviousButtonProps({ className: 'button button-ghost' }),
              )}
            >
              Previous
            </button>
            <button
              {...hostProps(lightbox.getNextButtonProps({ className: 'button button-ghost' }))}
            >
              Next
            </button>
          </div>
          <button
            type="button"
            className="button"
            onClick={() => onDownload(item)}
          >
            Download
          </button>
        </div>

        <div className="lightbox-stage">
          {item.type === 'video' ? (
            <video
              className="lightbox-media"
              src={item.previewUrl}
              controls
              playsInline
              autoPlay
            />
          ) : (
            <img
              className="lightbox-media"
              src={item.previewUrl}
              alt={item.alt ?? ''}
            />
          )}
        </div>

        <div className="lightbox-caption">
          <strong>{item.alt ?? item.title ?? `Item ${item.id}`}</strong>
          {item.photographer ? <span>by {item.photographer}</span> : null}
        </div>
      </div>
    </div>
  );
}
