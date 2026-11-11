type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'outline'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info'
  | 'link';

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

type DialogVariant = ButtonVariant;

export type { ButtonSize, ButtonVariant, DialogVariant };
