import { useId } from 'react';

// EmailAddressField is a single unified email-address control: a local-part input, an
// inline "@", and a domain chooser — a <select> when the deploy serves multiple domains
// (env.DOMAINS), or a static suffix when there's only one. Ported from the Claude Design
// "Sign in" mock (SignIn.dc.html → .dmcn-emailfield). The caller owns the local/domain
// state and composes `local@domain`; this component is presentation only.

let _styles = false;
function ensureStyles(): void {
  if (_styles || typeof document === 'undefined') return;
  _styles = true;
  const s = document.createElement('style');
  s.setAttribute('data-dmcn', 'emailfield');
  s.textContent = `
.dmcn-emailfield{display:flex;align-items:center;gap:2px;height:38px;padding:0 var(--space-3);
  background:var(--surface-card);border:1px solid var(--border-default);border-radius:var(--radius-md);
  font-family:var(--font-sans);font-size:var(--text-md);color:var(--text-strong);
  transition:border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard);}
.dmcn-emailfield:hover{border-color:var(--border-strong);}
.dmcn-emailfield:focus-within{border-color:var(--border-focus);box-shadow:0 0 0 3px var(--brand-subtle-2);}
.dmcn-emailfield__local{flex:1 1 auto;min-width:0;height:100%;border:none;background:none;outline:none;
  font:inherit;color:inherit;padding:0;}
.dmcn-emailfield__local::placeholder{color:var(--text-subtle);}
.dmcn-emailfield__at{flex:none;color:var(--text-muted);}
.dmcn-emailfield__domain-wrap{flex:none;position:relative;display:flex;align-items:center;}
.dmcn-emailfield__domain{height:100%;border:none;background:none;outline:none;font:inherit;
  color:var(--text-body);cursor:pointer;padding:0 18px 0 0;-webkit-appearance:none;appearance:none;}
.dmcn-emailfield__caret{position:absolute;right:0;pointer-events:none;color:var(--text-subtle);}
.dmcn-emailfield__domain-static{flex:none;color:var(--text-body);}
.dmcn-emailfield__domain-input{flex:1 1 auto;min-width:0;height:100%;border:none;background:none;
  outline:none;font:inherit;color:var(--text-body);padding:0;}
.dmcn-emailfield__domain-input::placeholder{color:var(--text-subtle);}
.dmcn-emailfield__label{font-size:var(--text-sm);font-weight:var(--weight-medium);color:var(--text-body);}
.dmcn-emailfield__req{color:var(--danger);margin-left:2px;}
/* iOS Safari zooms on focusing an input under 16px; keep the local field at 16px on
   small screens to suppress it (mirrors the design-system Input). */
@media (max-width:720px){.dmcn-emailfield{font-size:16px;}}
`;
  document.head.appendChild(s);
}

export interface EmailAddressFieldProps {
  /** Field label rendered above the control. */
  label: string;
  /** Local-part value (before the "@") and its setter. */
  localPart: string;
  onLocalChange: (value: string) => void;
  /** Currently selected domain (after the "@") and its setter. */
  domain: string;
  onDomainChange: (value: string) => void;
  /** Domains offered. One → static suffix; more → a picker. */
  domains: string[];
  id?: string;
  required?: boolean;
  autoFocus?: boolean;
  /** Local-part placeholder. @default "you" */
  placeholder?: string;
}

export function EmailAddressField({
  label, localPart, onLocalChange, domain, onDomainChange, domains,
  id, required = false, autoFocus = false, placeholder = 'you',
}: EmailAddressFieldProps) {
  ensureStyles();
  const rid = useId();
  const inputId = id ?? `email-local-${rid}`;
  // Three modes by how many domains the deploy offers: several ⇒ a dropdown, one
  // ⇒ a fixed suffix, none ⇒ let the user type the domain (an unconfigured
  // instance forces no default — the account being paired/imported may live on
  // any domain).
  const mode: 'picker' | 'fixed' | 'free' = domains.length > 1 ? 'picker' : domains.length === 1 ? 'fixed' : 'free';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <label className="dmcn-emailfield__label" htmlFor={inputId}>
        {label}{required && <span className="dmcn-emailfield__req">*</span>}
      </label>
      <div className="dmcn-emailfield">
        <input
          id={inputId}
          className="dmcn-emailfield__local"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={placeholder}
          value={localPart}
          // The domain is chosen separately, so an "@" in the local part is always a
          // mistake — strip it rather than produce an invalid two-"@" address.
          onChange={e => onLocalChange(e.target.value.replace(/@/g, ''))}
          autoFocus={autoFocus}
          required={required}
        />
        <span className="dmcn-emailfield__at">@</span>
        {mode === 'picker' ? (
          <span className="dmcn-emailfield__domain-wrap">
            <select
              className="dmcn-emailfield__domain"
              aria-label="Domain"
              value={domain}
              onChange={e => onDomainChange(e.target.value)}
            >
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <svg className="dmcn-emailfield__caret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </span>
        ) : mode === 'fixed' ? (
          <span className="dmcn-emailfield__domain-static">{domain}</span>
        ) : (
          <input
            className="dmcn-emailfield__domain-input"
            type="text"
            aria-label="Domain"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="yourdomain.com"
            value={domain}
            // Strip a stray "@" and lowercase — the domain is the part after the "@".
            onChange={e => onDomainChange(e.target.value.replace(/@/g, '').toLowerCase())}
            required={required}
          />
        )}
      </div>
    </div>
  );
}
