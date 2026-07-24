import React from 'react';

let _badgeStyles = false;
function ensureBadgeStyles(): void {
  if (_badgeStyles || typeof document === 'undefined') return;
  _badgeStyles = true;
  const s = document.createElement('style');
  s.setAttribute('data-dmcn', 'badge');
  s.textContent = `
.dmcn-badge{
  display:inline-flex;align-items:center;gap:6px;font-family:var(--font-sans);
  font-size:var(--text-xs);font-weight:var(--weight-medium);line-height:1;
  padding:3px 8px;border-radius:var(--radius-sm);border:1px solid transparent;white-space:nowrap;
}
.dmcn-badge__dot{width:6px;height:6px;border-radius:var(--radius-full);background:currentColor;flex:none;}
.dmcn-badge--neutral{background:var(--surface-sunken);color:var(--text-muted);border-color:var(--border-subtle);}
.dmcn-badge--brand{background:var(--brand-subtle);color:var(--brand-text);}
.dmcn-badge--success{background:var(--success-subtle);color:var(--success);}
.dmcn-badge--warning{background:var(--warning-subtle);color:var(--warning);}
.dmcn-badge--danger{background:var(--danger-subtle);color:var(--danger);}
.dmcn-badge--info{background:var(--info-subtle);color:var(--info);}
.dmcn-badge--trust-contact{background:var(--trust-contact-subtle);color:var(--trust-contact);}
.dmcn-badge--trust-dmcn{background:var(--trust-dmcn-subtle);color:var(--trust-dmcn);}
.dmcn-badge--solid{background:var(--brand);color:var(--text-onbrand);}
.dmcn-badge svg{width:12px;height:12px;}
`;
  document.head.appendChild(s);
}

/** Props for the status / category badge. */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** @default "neutral" */
  variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'trust-contact' | 'trust-dmcn' | 'solid';
  /** Leading status dot. @default false */
  dot?: boolean;
  /** Leading icon element. */
  icon?: React.ReactNode;
}

/**
 * Compact status / category label. Use for "Encrypted", unread counts,
 * folder labels, message states.
 */
export function Badge({
  variant = 'neutral',
  dot = false,
  icon = null,
  className = '',
  children,
  ...rest
}: BadgeProps): React.ReactElement {
  ensureBadgeStyles();
  const cls = ['dmcn-badge', `dmcn-badge--${variant}`, className].filter(Boolean).join(' ');
  return (
    <span className={cls} {...rest}>
      {dot && <span className="dmcn-badge__dot" />}
      {icon}
      {children}
    </span>
  );
}
