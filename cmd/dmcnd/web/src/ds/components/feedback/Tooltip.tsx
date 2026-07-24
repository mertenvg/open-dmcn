import React from 'react';

let _tipStyles = false;
function ensureTooltipStyles(): void {
  if (_tipStyles || typeof document === 'undefined') return;
  _tipStyles = true;
  const s = document.createElement('style');
  s.setAttribute('data-dmcn', 'tooltip');
  s.textContent = `
.dmcn-tip-wrap{position:relative;display:inline-flex;}
.dmcn-tip{
  position:absolute;z-index:50;pointer-events:none;
  font-family:var(--font-sans);font-size:var(--text-xs);font-weight:var(--weight-medium);
  color:var(--neutral-25);background:var(--neutral-900);
  padding:5px 8px;border-radius:var(--radius-sm);white-space:nowrap;box-shadow:var(--shadow-sm);
  opacity:0;transform:translateY(2px);
  transition:opacity var(--dur-fast) var(--ease-standard),transform var(--dur-fast) var(--ease-standard);
}
.dmcn-tip--show{opacity:1;transform:translateY(0);}
.dmcn-tip--top{bottom:calc(100% + 6px);left:50%;translate:-50% 0;}
.dmcn-tip--bottom{top:calc(100% + 6px);left:50%;translate:-50% 0;}
.dmcn-tip--right{left:calc(100% + 6px);top:50%;translate:0 -50%;}
.dmcn-tip--left{right:calc(100% + 6px);top:50%;translate:0 -50%;}
[data-theme="dark"] .dmcn-tip{background:var(--neutral-700);}
`;
  document.head.appendChild(s);
}

export interface TooltipProps {
  /** Tooltip text. */
  label: React.ReactNode;
  /** @default "top" */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Single interactive child the tooltip describes. */
  children: React.ReactNode;
}

/**
 * Lightweight hover/focus tooltip. Wrap a single interactive child.
 */
export function Tooltip({ label, side = 'top', children }: TooltipProps): React.ReactElement {
  ensureTooltipStyles();
  const [show, setShow] = React.useState(false);
  return (
    <span
      className="dmcn-tip-wrap"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      <span role="tooltip" className={`dmcn-tip dmcn-tip--${side}${show ? ' dmcn-tip--show' : ''}`}>
        {label}
      </span>
    </span>
  );
}
