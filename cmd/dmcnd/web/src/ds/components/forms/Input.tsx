import React from 'react';

let _inputStyles = false;
function ensureInputStyles(): void {
  if (_inputStyles || typeof document === 'undefined') return;
  _inputStyles = true;
  const s = document.createElement('style');
  s.setAttribute('data-dmcn', 'input');
  s.textContent = `
.dmcn-field{display:flex;flex-direction:column;gap:var(--space-2);font-family:var(--font-sans);}
.dmcn-field__label{font-size:var(--text-sm);font-weight:var(--weight-medium);color:var(--text-body);}
.dmcn-field__req{color:var(--danger);margin-left:2px;}
.dmcn-input-wrap{position:relative;display:flex;align-items:center;}
.dmcn-input-wrap__icon{position:absolute;left:var(--space-3);display:flex;color:var(--text-subtle);pointer-events:none;}
.dmcn-input-wrap__icon svg{width:16px;height:16px;}
.dmcn-input{
  width:100%;font-family:var(--font-sans);font-size:var(--text-md);color:var(--text-strong);
  background:var(--surface-card);border:1px solid var(--border-default);border-radius:var(--radius-md);
  height:38px;padding:0 var(--space-3);
  transition:border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard);
}
.dmcn-input--with-icon{padding-left:34px;}
.dmcn-input::placeholder{color:var(--text-subtle);}
.dmcn-input:hover{border-color:var(--border-strong);}
.dmcn-input:focus{outline:none;border-color:var(--border-focus);box-shadow:0 0 0 3px var(--brand-subtle-2);}
.dmcn-input[disabled]{background:var(--surface-sunken);color:var(--text-muted);cursor:not-allowed;}
.dmcn-input--invalid{border-color:var(--danger);}
.dmcn-input--invalid:focus{box-shadow:0 0 0 3px var(--danger-subtle);}
.dmcn-textarea{height:auto;min-height:84px;padding:var(--space-3);line-height:var(--leading-normal);resize:vertical;}
.dmcn-field__hint{font-size:var(--text-xs);color:var(--text-muted);}
.dmcn-field__hint--error{color:var(--danger);}
/* iOS Safari zooms the page when focusing an input whose font-size is < 16px,
   and the zoom persists across SPA navigation (e.g. login → inbox). Keep fields
   at 16px on small screens to suppress the auto-zoom entirely. */
@media (max-width:720px){.dmcn-input{font-size:16px;}}
`;
  document.head.appendChild(s);
}

/** Props for the labelled text input. */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Field label rendered above the input. */
  label?: string;
  /** Helper text below the field. */
  hint?: string;
  /** Error message; replaces hint and turns the field red. */
  error?: string;
  /** Show required asterisk. @default false */
  required?: boolean;
  /** Icon element shown inside the field, leading edge. */
  leadingIcon?: React.ReactNode;
}

/**
 * Text input with optional label, leading icon, hint / error.
 */
export function Input({
  label,
  hint,
  error,
  required = false,
  leadingIcon = null,
  id,
  className = '',
  ...rest
}: InputProps): React.ReactElement {
  ensureInputStyles();
  const inputId = id || (label ? 'in-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const inputCls = [
    'dmcn-input',
    leadingIcon ? 'dmcn-input--with-icon' : '',
    error ? 'dmcn-input--invalid' : '',
    className,
  ].filter(Boolean).join(' ');
  return (
    <div className="dmcn-field">
      {label && (
        <label className="dmcn-field__label" htmlFor={inputId}>
          {label}
          {required && <span className="dmcn-field__req">*</span>}
        </label>
      )}
      <div className="dmcn-input-wrap">
        {leadingIcon && <span className="dmcn-input-wrap__icon">{leadingIcon}</span>}
        <input id={inputId} className={inputCls} aria-invalid={!!error} {...rest} />
      </div>
      {(hint || error) && (
        <span className={'dmcn-field__hint' + (error ? ' dmcn-field__hint--error' : '')}>
          {error || hint}
        </span>
      )}
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

/**
 * Multi-line text input. Shares Input styling; vertical resize only.
 */
export function Textarea({
  label,
  hint,
  error,
  required = false,
  id,
  className = '',
  ...rest
}: TextareaProps): React.ReactElement {
  ensureInputStyles();
  const inputId = id || (label ? 'ta-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const cls = ['dmcn-input', 'dmcn-textarea', error ? 'dmcn-input--invalid' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className="dmcn-field">
      {label && (
        <label className="dmcn-field__label" htmlFor={inputId}>
          {label}
          {required && <span className="dmcn-field__req">*</span>}
        </label>
      )}
      <textarea id={inputId} className={cls} aria-invalid={!!error} {...rest} />
      {(hint || error) && (
        <span className={'dmcn-field__hint' + (error ? ' dmcn-field__hint--error' : '')}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
