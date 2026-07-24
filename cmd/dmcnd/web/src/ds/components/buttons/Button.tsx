import React from 'react';

/* Inject interaction-state CSS once (hover/active/focus/disabled can't be
   expressed with inline styles). All visuals reference DMCN tokens. */
let _btnStyles = false;
function ensureButtonStyles(): void {
  if (_btnStyles || typeof document === 'undefined') return;
  _btnStyles = true;
  const s = document.createElement('style');
  s.setAttribute('data-dmcn', 'button');
  s.textContent = `
.dmcn-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:var(--space-2);
  font-family:var(--font-sans);font-weight:var(--weight-medium);
  border:1px solid transparent;border-radius:var(--radius-md);
  cursor:pointer;white-space:nowrap;text-decoration:none;
  transition:background var(--dur-fast) var(--ease-standard),
             border-color var(--dur-fast) var(--ease-standard),
             color var(--dur-fast) var(--ease-standard),
             transform var(--dur-fast) var(--ease-standard);
  -webkit-tap-highlight-color:transparent;user-select:none;
}
.dmcn-btn:focus-visible{outline:none;box-shadow:var(--focus-ring);}
.dmcn-btn:active{transform:translateY(0.5px);}
.dmcn-btn[disabled]{cursor:not-allowed;opacity:0.45;pointer-events:none;}
.dmcn-btn--full{width:100%;}

/* sizes */
.dmcn-btn--sm{height:30px;padding:0 var(--space-3);font-size:var(--text-sm);}
.dmcn-btn--md{height:38px;padding:0 var(--space-4);font-size:var(--text-md);}
.dmcn-btn--lg{height:46px;padding:0 var(--space-6);font-size:var(--text-base);}

/* primary */
.dmcn-btn--primary{background:var(--brand);color:var(--text-onbrand);}
.dmcn-btn--primary:hover{background:var(--brand-hover);}
.dmcn-btn--primary:active{background:var(--brand-active);}

/* secondary (neutral outline) */
.dmcn-btn--secondary{background:var(--surface-card);color:var(--text-body);border-color:var(--border-default);}
.dmcn-btn--secondary:hover{background:var(--surface-hover);border-color:var(--border-strong);}
.dmcn-btn--secondary:active{background:var(--surface-active);}

/* ghost */
.dmcn-btn--ghost{background:transparent;color:var(--text-body);}
.dmcn-btn--ghost:hover{background:var(--surface-hover);}
.dmcn-btn--ghost:active{background:var(--surface-active);}

/* danger */
.dmcn-btn--danger{background:var(--danger);color:#fff;}
.dmcn-btn--danger:hover{background:var(--danger-hover);}

.dmcn-btn svg{width:1.05em;height:1.05em;flex:none;}
`;
  document.head.appendChild(s);
}

/** Props for the DMCN action button. */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual emphasis. @default "primary" */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Stretch to fill container width. @default false */
  fullWidth?: boolean;
  /** Icon element rendered before the label. */
  leftIcon?: React.ReactNode;
  /** Icon element rendered after the label. */
  rightIcon?: React.ReactNode;
}

/**
 * Primary action button for DMCN. Sharp corners, teal primary, quick hover.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps): React.ReactElement {
  ensureButtonStyles();
  const cls = [
    'dmcn-btn',
    `dmcn-btn--${variant}`,
    `dmcn-btn--${size}`,
    fullWidth ? 'dmcn-btn--full' : '',
    className,
  ].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} {...rest}>
      {leftIcon}
      {children != null && <span>{children}</span>}
      {rightIcon}
    </button>
  );
}
