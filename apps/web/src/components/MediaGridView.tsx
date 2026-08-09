import { useMediaGrid } from '@mediaforge/ui-react';
import { hostProps } from '../lib/hostProps';
import type { AppMediaItem } from '../lib/mapMedia';

interface MediaGridViewProps {
  items: AppMediaItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  loadMore: () => void;
  onSelect: (item: AppMediaItem, index: number) => void;
}

export function MediaGridView(props: MediaGridViewProps) {
  const { items, isLoading, isLoadingMore, hasNextPage, loadMore, onSelect } = props;

  const grid = useMediaGrid({
    items,
    isLoading,
    isLoadingMore,
    hasNextPage,
    loadMore,
    onSelect,
  });

  return (
    <div className="grid-shell">
      <div {...hostProps(grid.getGridProps({ className: 'media-grid' }))}>
        {items.map((item, index) => (
          <article
            key={`${item.type}-${item.id}`}
            {...hostProps(grid.getItemProps(item, index, { className: 'media-card' }))}
          >
            {item.type === 'video' ? (
              <video
                className="media-card__media"
                src={item.previewUrl}
                muted
                playsInline
                preload="metadata"
                aria-label={item.alt ?? 'Video preview'}
              />
            ) : (
              <img
                className="media-card__media"
                src={item.previewUrl}
                alt={item.alt ?? ''}
                loading="lazy"
              />
            )}
            <div className="media-card__meta">
              <span>{item.type}</span>
              {item.photographer ? <span>{item.photographer}</span> : null}
            </div>
          </article>
        ))}
      </div>

      {hasNextPage ? (
        <div className="grid-footer">
          <button
            {...hostProps(grid.getLoadMoreProps({ className: 'button button-ghost' }))}
          >
            {isLoadingMore ? 'Loading more…' : 'Load more'}
          </button>
          <div
            {...hostProps(
              grid.getInfiniteScrollSentinelProps({ className: 'sentinel' }),
            )}
          />
        </div>
      ) : null}
    </div>
  );
}
