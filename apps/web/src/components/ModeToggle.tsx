export type SearchMode = 'photos' | 'videos';

interface ModeToggleProps {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
}

export function ModeToggle(props: ModeToggleProps) {
  const { mode, onChange } = props;

  return (
    <div className="mode-toggle" role="group" aria-label="Search mode">
      <button
        type="button"
        className={mode === 'photos' ? 'button is-active' : 'button button-ghost'}
        aria-pressed={mode === 'photos'}
        onClick={() => onChange('photos')}
      >
        Photos
      </button>
      <button
        type="button"
        className={mode === 'videos' ? 'button is-active' : 'button button-ghost'}
        aria-pressed={mode === 'videos'}
        onClick={() => onChange('videos')}
      >
        Videos
      </button>
    </div>
  );
}
