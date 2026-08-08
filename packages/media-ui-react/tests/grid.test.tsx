import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMediaGrid } from '../src/grid/useMediaGrid.js';
import { createItem, installIntersectionObserverMock } from './helpers.js';

function GridHarness(props: {
  items?: ReturnType<typeof createItem>[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  onSelect?: (item: ReturnType<typeof createItem>, index: number) => void;
  onItemClick?: () => void;
}) {
  const items = props.items ?? [createItem(1), createItem(2)];
  const grid = useMediaGrid({
    items,
    isLoading: props.isLoading ?? false,
    isLoadingMore: props.isLoadingMore ?? false,
    hasNextPage: props.hasNextPage ?? true,
    loadMore: props.loadMore ?? (() => undefined),
    onSelect: props.onSelect,
  });

  return (
    <div {...grid.getGridProps({ 'data-testid': 'grid' })}>
      {items.map((item, index) => (
        <button
          key={item.id}
          {...grid.getItemProps(item, index, {
            onClick: props.onItemClick,
            className: 'cell',
          })}
        >
          {item.alt}
        </button>
      ))}
      <button {...grid.getLoadMoreProps({ 'data-testid': 'load-more' })}>
        Load more
      </button>
      <div
        {...grid.getInfiniteScrollSentinelProps({ 'data-testid': 'sentinel' })}
      />
    </div>
  );
}

describe('useMediaGrid', () => {
  it('renders items through consumer markup and merges handlers/className', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onItemClick = vi.fn();

    render(
      <GridHarness onSelect={onSelect} onItemClick={onItemClick} />,
    );

    expect(screen.getByText('Item 1')).toBeTruthy();
    expect(screen.getByText('Item 1').className).toContain('cell');

    await user.click(screen.getByText('Item 1'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 0);
    expect(onItemClick).toHaveBeenCalled();
  });

  it('supports keyboard activation and arrow movement', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<GridHarness onSelect={onSelect} />);

    const first = screen.getByText('Item 1');
    first.focus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 0);

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByText('Item 2'));
  });

  it('calls loadMore from the load-more control', async () => {
    const user = userEvent.setup();
    const loadMore = vi.fn();
    render(<GridHarness loadMore={loadMore} hasNextPage />);

    await user.click(screen.getByTestId('load-more'));
    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('disables load-more when there is no next page or loading more', () => {
    const { rerender } = render(
      <GridHarness hasNextPage={false} isLoadingMore={false} />,
    );
    expect(screen.getByTestId('load-more')).toHaveProperty('disabled', true);

    rerender(<GridHarness hasNextPage isLoadingMore />);
    expect(screen.getByTestId('load-more')).toHaveProperty('disabled', true);
  });

  it('triggers infinite scroll via sentinel intersection and avoids duplicates while loading', () => {
    const observer = installIntersectionObserverMock();
    const loadMore = vi.fn();

    const { rerender } = render(
      <GridHarness loadMore={loadMore} hasNextPage isLoadingMore={false} />,
    );

    observer.triggerAll(true);
    expect(loadMore).toHaveBeenCalledTimes(1);

    rerender(
      <GridHarness loadMore={loadMore} hasNextPage isLoadingMore />,
    );
    observer.triggerAll(true);
    expect(loadMore).toHaveBeenCalledTimes(1);

    observer.restore();
  });

  it('does not call loadMore when hasNextPage is false', () => {
    const observer = installIntersectionObserverMock();
    const loadMore = vi.fn();

    render(
      <GridHarness loadMore={loadMore} hasNextPage={false} isLoadingMore={false} />,
    );
    observer.triggerAll(true);
    expect(loadMore).not.toHaveBeenCalled();
    observer.restore();
  });
});
