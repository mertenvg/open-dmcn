import React from 'react';

let _usageStyles = false;
function ensureUsageStyles(): void {
  if (_usageStyles || typeof document === 'undefined') return;
  _usageStyles = true;
  const s = document.createElement('style');
  s.setAttribute('data-dmcn', 'usage-meter');
  s.textContent = `
.dmcn-usage{display:flex;flex-direction:column;gap:6px;font-family:var(--font-sans);width:100%;}
.dmcn-usage__head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;}
.dmcn-usage__label{font-size:var(--text-sm);font-weight:var(--weight-medium);color:var(--text-body);}
.dmcn-usage__value{font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--text-strong);
  font-variant-numeric:tabular-nums;white-space:nowrap;}
.dmcn-usage__track{position:relative;width:100%;background:var(--surface-sunken);
  overflow:hidden;}
.dmcn-usage--sm .dmcn-usage__track{height:6px;}
.dmcn-usage--md .dmcn-usage__track{height:8px;}
.dmcn-usage--lg .dmcn-usage__track{height:12px;}
.dmcn-usage__fill{height:100%;
  transition:width var(--ease-out,ease) .4s, background-color .3s;min-width:2px;}
.dmcn-usage--brand   .dmcn-usage__fill{background:var(--brand);}
.dmcn-usage--success .dmcn-usage__fill{background:var(--success);}
.dmcn-usage--warning .dmcn-usage__fill{background:var(--warning);}
.dmcn-usage--danger  .dmcn-usage__fill{background:var(--danger);}
.dmcn-usage--brand   .dmcn-usage__value{color:var(--brand-text);}
.dmcn-usage--warning .dmcn-usage__value{color:var(--warning);}
.dmcn-usage--danger  .dmcn-usage__value{color:var(--danger);}
.dmcn-usage__caption{font-size:var(--text-xs);color:var(--text-muted);}
`;
  document.head.appendChild(s);
}

/** Props for the quota / usage indicator. */
export interface UsageMeterProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Current usage amount. */
  value: number;
  /** Maximum (full) amount. @default 100 */
  max?: number;
  /** Label shown above the track, e.g. "Storage". */
  label?: string;
  /** Track thickness. @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Fill color. "auto" derives it from the fill level
   * (brand → warning ≥75% → danger ≥90%). @default "auto"
   */
  variant?: 'auto' | 'brand' | 'success' | 'warning' | 'danger';
  /**
   * Override the right-side readout. Defaults to the rounded percent
   * (e.g. "67%"). Pass "8.2 GB of 15 GB" for absolute values, or "" to hide.
   */
  valueText?: string;
  /** Helper text below the track, e.g. "Resets on Jul 1". */
  caption?: string;
}

/**
 * Quota / usage indicator. Shows a labeled progress track with a value
 * readout, e.g. "You've used 67% of your quota". Auto-colors by fill
 * level (brand → warning ≥75% → danger ≥90%) unless `variant` is set.
 */
export function UsageMeter({
  value,
  max = 100,
  label = '',
  size = 'md',
  variant = 'auto',
  valueText,
  caption,
  className = '',
  ...rest
}: UsageMeterProps): React.ReactElement {
  ensureUsageStyles();
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const resolved =
    variant !== 'auto' ? variant : pct >= 90 ? 'danger' : pct >= 75 ? 'warning' : 'brand';
  const readout = valueText != null ? valueText : `${Math.round(pct)}%`;
  const cls = ['dmcn-usage', `dmcn-usage--${size}`, `dmcn-usage--${resolved}`, className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls} {...rest}>
      {(label || valueText !== '') && (
        <div className="dmcn-usage__head">
          {label && <span className="dmcn-usage__label">{label}</span>}
          {readout !== '' && <span className="dmcn-usage__value">{readout}</span>}
        </div>
      )}
      <div
        className="dmcn-usage__track"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Usage'}
      >
        <div className="dmcn-usage__fill" style={{ width: `${pct}%` }} />
      </div>
      {caption && <span className="dmcn-usage__caption">{caption}</span>}
    </div>
  );
}
