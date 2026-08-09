import type { FormEvent } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function SearchBar(props: SearchBarProps) {
  const { value, onChange, onSubmit, isLoading } = props;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="search" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="media-search">
        Search media
      </label>
      <input
        id="media-search"
        name="q"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search photos or videos"
        autoComplete="off"
      />
      {value ? (
        <button
          type="button"
          className="button button-ghost"
          onClick={() => onChange('')}
        >
          Clear
        </button>
      ) : null}
      <button type="submit" className="button" disabled={isLoading || !value.trim()}>
        {isLoading ? 'Searching…' : 'Search'}
      </button>
    </form>
  );
}
