import React from 'react';

let _tabsStyles = false;
function ensureTabsStyles(): void {
  if (_tabsStyles || typeof document === 'undefined') return;
  _tabsStyles = true;
  const s = document.createElement('style');
  s.setAttribute('data-dmcn', 'tabs');
  s.textContent = `
.dmcn-tabs{display:flex;gap:var(--space-1);border-bottom:1px solid var(--border-default);font-family:var(--font-sans);}
.dmcn-tab{
  position:relative;appearance:none;border:none;background:transparent;cursor:pointer;
  font-family:inherit;font-size:var(--text-md);font-weight:var(--weight-medium);
  color:var(--text-muted);padding:var(--space-3) var(--space-3);margin-bottom:-1px;
  border-bottom:2px solid transparent;display:inline-flex;align-items:center;gap:var(--space-2);
  transition:color var(--dur-fast) var(--ease-standard);
}
.dmcn-tab:hover{color:var(--text-strong);}
.dmcn-tab--active{color:var(--brand-text);border-bottom-color:var(--brand);}
.dmcn-tab:focus-visible{outline:none;box-shadow:var(--focus-ring);border-radius:var(--radius-sm);}
.dmcn-tab svg{width:16px;height:16px;}
.dmcn-tab__count{
  font-size:var(--text-2xs);font-weight:var(--weight-semibold);color:var(--text-muted);
  background:var(--surface-sunken);padding:1px 6px;border-radius:var(--radius-sm);
}
.dmcn-tab--active .dmcn-tab__count{background:var(--brand-subtle);color:var(--brand-text);}
`;
  document.head.appendChild(s);
}

export interface TabItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** Optional count pill (e.g. unread per category). */
  count?: number;
}

/** Props for the underline tab bar. */
export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: TabItem[];
  /** Currently selected tab value (controlled). */
  value: string;
  onChange?: (value: string) => void;
}

/**
 * Underline tab bar. Controlled via `value` / `onChange`.
 * items: [{ value, label, icon?, count? }]
 */
export function Tabs({
  items = [],
  value,
  onChange,
  className = '',
  ...rest
}: TabsProps): React.ReactElement {
  ensureTabsStyles();
  const cls = ['dmcn-tabs', className].filter(Boolean).join(' ');
  return (
    <div className={cls} role="tablist" {...rest}>
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            className={'dmcn-tab' + (active ? ' dmcn-tab--active' : '')}
            onClick={() => onChange && onChange(it.value)}
          >
            {it.icon}
            {it.label}
            {it.count != null && <span className="dmcn-tab__count">{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
