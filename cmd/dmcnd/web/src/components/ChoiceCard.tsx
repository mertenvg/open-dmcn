import type { ReactNode } from 'react';
import { Icon } from './Icon';

export interface ChoiceCardProps {
  checked: boolean;
  onClick: () => void;
  icon: string;        // Icon name
  title: string;
  badge?: string;      // e.g. "RECOMMENDED"
  desc: string;
  /** Expandable content shown under the header when selected (e.g. a passphrase field). */
  children?: ReactNode;
}

/**
 * Radio-style selection card from the Claude Design auth screens: a dot + icon +
 * title (+ optional badge) + description, brand-highlighted when selected, with an
 * optional expandable body. Shared by Add Device and Create Account.
 */
export function ChoiceCard({ checked, onClick, icon, title, badge, desc, children }: ChoiceCardProps) {
  return (
    <div style={{
      border: `1px solid ${checked ? 'var(--brand)' : 'var(--border-default)'}`,
      background: checked ? 'var(--brand-subtle)' : 'var(--surface-card)',
      borderRadius: 'var(--radius-md)', padding: 14, transition: 'border-color 120ms, background 120ms',
    }}>
      <div
        role="button" tabIndex={0} onClick={onClick}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}
      >
        <span style={{
          flex: 'none', width: 18, height: 18, marginTop: 1, borderRadius: 999,
          border: `2px solid ${checked ? 'var(--brand)' : 'var(--border-strong)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {checked && <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--brand)' }} />}
        </span>
        <span style={{ flex: '1 1 0', display: 'block', minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <Icon name={icon} size={15} style={{ color: 'var(--text-strong)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{title}</span>
            {badge && (
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.04em', color: 'var(--brand-text)', background: 'var(--brand-subtle-2)', padding: '1px 6px', borderRadius: 'var(--radius-sm)' }}>{badge}</span>
            )}
          </span>
          <span style={{ display: 'block', marginTop: 4, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</span>
        </span>
      </div>
      {checked && children && <div style={{ marginTop: 14, marginLeft: 30 }}>{children}</div>}
    </div>
  );
}
