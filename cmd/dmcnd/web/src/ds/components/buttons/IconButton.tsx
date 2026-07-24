import React from 'react';

let _iconBtnStyles = false;
function ensureIconButtonStyles(): void {
  if (_iconBtnStyles || typeof document === 'undefined') return;
  _iconBtnStyles = true;
  const s = document.createElement('style');
  s.setAttribute('data-dmcn', 'icon-button');
  s.textContent = `
.dmcn-iconbtn{
  display:inline-flex;align-items:center;justify-content:center;
  border:1px solid transparent;border-radius:var(--radius-md);
  background:transparent;color:var(--text-muted);cursor:pointer;
  transition:background var(--dur-fast) var(--ease-standard),
             color var(--dur-fast) var(--ease-standard),
             border-color var(--dur-fast) var(--ease-standard);
  -webkit-tap-highlight-color:transparent;
}
.dmcn-iconbtn:hover{background:var(--surface-hover);color:var(--text-strong);}
.dmcn-iconbtn:active{background:var(--surface-active);}
.dmcn-iconbtn:focus-visible{outline:none;box-shadow:var(--focus-ring);}
.dmcn-iconbtn[disabled]{cursor:not-allowed;opacity:0.4;pointer-events:none;}
.dmcn-iconbtn--sm{width:30px;height:30px;}
.dmcn-iconbtn--md{width:38px;height:38px;}
.dmcn-iconbtn--lg{width:44px;height:44px;}
.dmcn-iconbtn--solid{background:var(--brand);color:var(--text-onbrand);}
.dmcn-iconbtn--solid:hover{background:var(--brand-hover);color:var(--text-onbrand);}
.dmcn-iconbtn--outline{border-color:var(--border-default);color:var(--text-body);}
.dmcn-iconbtn--outline:hover{border-color:var(--border-strong);background:var(--surface-hover);}
.dmcn-iconbtn--active{background:var(--brand-subtle);color:var(--brand-text);}
.dmcn-iconbtn svg{width:18px;height:18px;}
.dmcn-iconbtn--sm svg{width:16px;height:16px;}
`;
  document.head.appendChild(s);
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** @default "ghost" */
  variant?: 'ghost' | 'solid' | 'outline';
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Sticky selected state (e.g. active toolbar tool). @default false */
  active?: boolean;
}

/**
 * Square icon-only button. Use for toolbar actions, archive/delete,
 * sidebar toggles. Always pass an aria-label.
 */
export function IconButton({
  variant = 'ghost',
  size = 'md',
  active = false,
  type = 'button',
  className = '',
  children,
  ...rest
}: IconButtonProps): React.ReactElement {
  ensureIconButtonStyles();
  const cls = [
    'dmcn-iconbtn',
    `dmcn-iconbtn--${size}`,
    variant === 'solid' ? 'dmcn-iconbtn--solid' : '',
    variant === 'outline' ? 'dmcn-iconbtn--outline' : '',
    active ? 'dmcn-iconbtn--active' : '',
    className,
  ].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}
