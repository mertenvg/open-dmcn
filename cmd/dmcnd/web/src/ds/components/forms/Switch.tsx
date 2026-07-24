import React from 'react';

let _switchStyles = false;
function ensureSwitchStyles(): void {
  if (_switchStyles || typeof document === 'undefined') return;
  _switchStyles = true;
  const s = document.createElement('style');
  s.setAttribute('data-dmcn', 'switch');
  s.textContent = `
.dmcn-switch{display:inline-flex;align-items:center;gap:var(--space-3);font-family:var(--font-sans);cursor:pointer;user-select:none;}
.dmcn-switch[aria-disabled="true"]{cursor:not-allowed;opacity:0.5;}
.dmcn-switch__track{
  position:relative;flex:none;width:40px;height:22px;border-radius:var(--radius-pill);
  background:var(--neutral-300);transition:background var(--dur-normal) var(--ease-standard);
}
.dmcn-switch__thumb{
  position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:var(--radius-full);
  background:#fff;box-shadow:var(--shadow-xs);
  transition:transform var(--dur-normal) var(--ease-out);
}
.dmcn-switch--on .dmcn-switch__track{background:var(--brand);}
.dmcn-switch--on .dmcn-switch__thumb{transform:translateX(18px);}
.dmcn-switch__native{position:absolute;opacity:0;width:1px;height:1px;}
.dmcn-switch__native:focus-visible + .dmcn-switch__track{box-shadow:var(--focus-ring);}
.dmcn-switch__label{font-size:var(--text-md);color:var(--text-body);}
`;
  document.head.appendChild(s);
}

export interface SwitchProps {
  /** On/off state (controlled). @default false */
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
 * On/off toggle. One of the few intentionally-rounded elements in DMCN.
 */
export function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  id,
  ...rest
}: SwitchProps): React.ReactElement {
  ensureSwitchStyles();
  const sid =
    id || (typeof label === 'string' ? 'sw-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
  return (
    <label
      className={'dmcn-switch' + (checked ? ' dmcn-switch--on' : '')}
      aria-disabled={disabled}
      htmlFor={sid}
    >
      <input
        id={sid}
        type="checkbox"
        role="switch"
        className="dmcn-switch__native"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.checked, e)}
        {...rest}
      />
      <span className="dmcn-switch__track">
        <span className="dmcn-switch__thumb" />
      </span>
      {label && <span className="dmcn-switch__label">{label}</span>}
    </label>
  );
}
