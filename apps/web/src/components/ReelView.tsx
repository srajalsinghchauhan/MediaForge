import { useEffect, useRef } from 'react';
import { useMediaReelSwiper } from '@mediaforge/ui-react';
import { hostProps } from '../lib/hostProps';
import type { AppMediaItem } from '../lib/mapMedia';

interface ReelViewProps {
  items: AppMediaItem[];
  activeIndex: number;
  onActiveChange: (item: AppMediaItem, index: number) => void;
  onClose: () => void;
}

export function ReelView(props: ReelViewProps) {
  const { items, activeIndex, onActiveChange, onClose } = props;
  const videoRefs = useRef(new Map<number, HTMLVideoElement>());

  const reel = useMediaReelSwiper({
    items,
    activeIndex,
    onActiveChange: (item, index) => {
      onActiveChange(item as AppMediaItem, index);
    },
  });

  useEffect(() => {
    for (const [index, video] of videoRefs.current.entries()) {
      if (index === activeIndex) {
        const playResult = video.play();
        if (playResult && typeof playResult.catch === 'function') {
          void playResult.catch(() => undefined);
        }
      } else {
        video.pause();
      }
    }
  }, [activeIndex]);

  return (
    <div className="reel-root">
      <header className="reel-header">
        <h2>Reels</h2>
        <button type="button" className="button button-ghost" onClick={onClose}>
          Close reels
        </button>
      </header>

      <div {...hostProps(reel.getContainerProps({ className: 'reel' }))}>
        {items.map((item, index) => (
          <section
            key={`${item.id}-${index}`}
            {...hostProps(reel.getSlideProps(item, index, { className: 'reel-slide' }))}
          >
            <video
              ref={(node) => {
                if (node) {
                  videoRefs.current.set(index, node);
                } else {
                  videoRefs.current.delete(index);
                }
              }}
              className="reel-video"
              src={item.previewUrl}
              muted
              playsInline
              loop
              controls
            />
            <div className="reel-meta">
              <strong>{item.alt ?? item.title ?? `Video ${item.id}`}</strong>
              {item.photographer ? <span>{item.photographer}</span> : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
