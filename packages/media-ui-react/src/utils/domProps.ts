import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  Ref,
} from 'react';

export type WebElementProps = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>;
  style?: CSSProperties;
  [key: `data-${string}`]: string | number | undefined;
};

export type WebButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: Ref<HTMLButtonElement>;
  [key: `data-${string}`]: string | number | undefined;
};
