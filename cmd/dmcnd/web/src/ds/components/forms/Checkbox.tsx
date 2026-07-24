import React from 'react';

let _checkStyles = false;
function ensureCheckStyles(): void {
  if (_checkStyles || typeof document === 'undefined') return;
  _checkStyles = true;
  const s = document.createElement('style');
  s.setAttribute('data-dmcn', 'checkbox');
  s.textContent = `
.dmcn-check{display:inline-flex;align-items:flex-start;gap:var(--space-2);font-family:var(--font-sans);cursor:pointer;user-select:none;}
.dmcn-check[aria-disabled="true"]{cursor:not-allowed;opacity:0.5;}
.dmcn-check__box{
  flex:none;width:18px;height:18px;margin-top:1px;border:1.5px solid var(--border-strong);
  border-radius:var(--radius-sm);background:var(--surface-card);
  display:flex;align-items:center;justify-content:center;color:transparent;
  transition:background var(--dur-fast) var(--ease-standard),border-color var(--dur-fast) var(--ease-standard);
}
.dmcn-check__box svg{width:12px;height:12px;stroke-width:3;}
.dmcn-check:hover .dmcn-check__box{border-color:var(--brand);}
.dmcn-check--on .dmcn-check__box{background:var(--brand);border-color:var(--brand);color:var(--text-onbrand);}
.dmcn-check__native{position:absolute;opacity:0;width:1px;height:1px;}
.dmcn-check__native:focus-visible + .dmcn-check__box{box-shadow:var(--focus-ring);}
.dmcn-check__label{font-size:var(--text-md);color:var(--text-body);line-height:var(--leading-snug);}
`;
  document.head.appendChild(s);
}

const Check = (): React.ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter">
    <path d="M4 12l5 5L20 6" />
  </svg>
);

export interface CheckboxProps {
  /** Checked state (controlled). @default false */
  checked?: boolean;
  /** Fires with the next boolean value and the change event. */
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** @default false */
  disabled?: boolean;
  /** Inline label text. */
  label?: React.ReactNode;
  id?: string;
}

/**
 * Square checkbox with label. Controlled via `checked` / `onChange`.
 */
export function Checkbox({
  checked = false,
  onChange,
  disabled = false,
  label,
  id,
  ...rest
}: CheckboxProps): React.ReactElement {
  ensureCheckStyles();
  const cid =
    id || (typeof label === 'string' ? 'cb-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
  return (
    <label
      className={'dmcn-check' + (checked ? ' dmcn-check--on' : '')}
      aria-disabled={disabled}
      htmlFor={cid}
    >
      <input
        id={cid}
        type="checkbox"
        className="dmcn-check__native"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.checked, e)}
        {...rest}
      />
      <span className="dmcn-check__box">
        <Check />
      </span>
      {label && <span className="dmcn-check__label">{label}</span>}
    </label>
  );
}
