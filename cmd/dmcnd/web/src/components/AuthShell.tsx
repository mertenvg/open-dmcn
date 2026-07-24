import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { readTheme } from '../lib/theme';

export interface AuthShellProps {
  /** Heading above the form (e.g. "Welcome back"). */
  title: string;
  /** Sub-heading line under the title. */
  subtitle: string;
  /** The form / body content. */
  children: ReactNode;
  /** Reassurance line under the body (shield icon). Defaults to the standard line. */
  note?: ReactNode;
  /** Footer node (links). */
  footer?: ReactNode;
}

const DEFAULT_NOTE = "Your keys never leave your device. We can't read your mail.";

/**
 * Two-panel authentication layout (form on the left, end-to-end-encryption brand
 * panel on the right) from the Claude Design "Account selection list" project. Shared
 * by sign-in, register, import and device-pairing so every pre-auth screen matches.
 */
export function AuthShell({ title, subtitle, children, note = DEFAULT_NOTE, footer }: AuthShellProps) {
  return (
    <div
      data-theme={readTheme()}
      style={{
        minHeight: '100dvh', display: 'flex', background: 'var(--surface-page)',
        color: 'var(--text-body)', fontFamily: 'var(--font-sans)', WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* Left: form (safe-area padding so it clears the status bar / home indicator in
          standalone PWA). On narrow viewports the form top-aligns with tighter padding
          — see .dmcn-auth-left in tokens.css. */}
      <div className="dmcn-auth-left" style={{
        flex: '1 1 0', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'calc(var(--space-8) + env(safe-area-inset-top)) calc(var(--space-8) + env(safe-area-inset-right)) calc(var(--space-8) + env(safe-area-inset-bottom)) calc(var(--space-8) + env(safe-area-inset-left))',
      }}>
        <div style={{ width: '100%', maxWidth: 430 }}>
          <div style={{ display: 'inline-flex', alignItems: 'flex-end', fontWeight: 600, fontSize: 34, letterSpacing: '-1.5px', color: 'var(--text-strong)' }}>
            dmcn<span style={{ width: 9, height: 9, background: 'var(--brand)', marginLeft: 5, marginBottom: 6 }} />
          </div>
          <h1 style={{ margin: 'var(--space-6) 0 var(--space-1)', fontSize: 'var(--text-2xl)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)', color: 'var(--text-strong)' }}>{title}</h1>
          <p style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--text-muted)' }}>{subtitle}</p>

          <div style={{ marginTop: 'var(--space-6)' }}>{children}</div>

          {note && (
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)', lineHeight: 1.45 }}>
              <Icon name="shield-check" size={15} style={{ color: 'var(--brand)', flex: 'none', marginTop: 1 }} />
              <span>{note}</span>
            </div>
          )}
          {footer && <div style={{ marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{footer}</div>}
        </div>
      </div>

      {/* Right: brand panel — seamless on the page, theme-aware (hidden on narrow viewports) */}
      <div
        className="dmcn-auth-brand"
        style={{
          flex: '1 1 0', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: 'var(--space-20)',
        }}
      >
        <span style={{
          alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)',
          fontWeight: 500, whiteSpace: 'nowrap', color: 'var(--brand-text)', background: 'var(--brand-subtle)',
          padding: '3px 8px', borderRadius: 'var(--radius-sm)',
        }}>
          <Icon name="lock" size={12} /> End-to-end encrypted
        </span>
        <h2 style={{ margin: 'var(--space-5) 0 0', fontSize: 46, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.08, maxWidth: 480, color: 'var(--text-strong)' }}>
          Email that only you can read.
        </h2>
        <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-lg)', color: 'var(--text-muted)', maxWidth: 440, lineHeight: 1.5 }}>
          DMCN routes your mail across a decentralised mesh and encrypts it on your device — no central server ever holds your keys.
        </p>
        <div style={{ marginTop: 'var(--space-10)', display: 'flex', gap: 'var(--space-12)', maxWidth: 480 }}>
          {([['key', 'Your keys, your device'], ['shield', 'No central server'], ['mail', 'Works like email']] as const).map(([ic, txt]) => (
            <div key={txt} style={{ flex: '1 1 0' }}>
              <Icon name={ic} size={22} style={{ color: 'var(--brand)' }} />
              <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-base)', color: 'var(--text-body)' }}>{txt}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
