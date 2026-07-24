import React from 'react';

let _tagStyles = false;
function ensureTagStyles(): void {
  if (_tagStyles || typeof document === 'undefined') return;
  _tagStyles = true;
  const s = document.createElement('style');
  s.setAttribute('data-dmcn', 'tag');
  s.textContent = `
.dmcn-tag{
  display:inline-flex;align-items:center;gap:6px;font-family:var(--font-sans);
  font-size:var(--text-sm);color:var(--text-body);background:var(--surface-card);
  border:1px solid var(--border-default);border-radius:var(--radius-sm);
  padding:3px 8px;line-height:1.2;white-space:nowrap;
}
.dmcn-tag__swatch{width:8px;height:8px;border-radius:var(--radius-full);flex:none;}
.dmcn-tag__remove{
  display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;
  margin-right:-2px;border:none;background:transparent;color:var(--text-subtle);cursor:pointer;
  border-radius:var(--radius-sm);
}
.dmcn-tag__remove:hover{background:var(--surface-active);color:var(--text-strong);}
.dmcn-tag__remove svg{width:11px;height:11px;stroke-width:2.5;}
`;
  document.head.appendChild(s);
}

const X = (): React.ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="square">
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
);

export interface TagProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'> {
  /** Optional leading color swatch (folder/label color). */
  color?: string | null;
  /** When provided, renders a remove (×) button calling this handler. */
  onRemove?: ((e: React.MouseEvent) => void) | null;
}

/**
 * Removable label / category chip. Optional color swatch (folder labels),
 * optional remove button (recipient chips, filters).
 */
export function Tag({
  color = null,
  onRemove = null,
  className = '',
  children,
  ...rest
}: TagProps): React.ReactElement {
  ensureTagStyles();
  const cls = ['dmcn-tag', className].filter(Boolean).join(' ');
  return (
    <span className={cls} {...rest}>
      {color && <span className="dmcn-tag__swatch" style={{ background: color }} />}
      {children}
      {onRemove && (
        <button type="button" className="dmcn-tag__remove" aria-label="Remove" onClick={onRemove}>
          <X />
        </button>
      )}
    </span>
  );
}
