import React from 'react';

let _avatarStyles = false;
function ensureAvatarStyles(): void {
  if (_avatarStyles || typeof document === 'undefined') return;
  _avatarStyles = true;
  const s = document.createElement('style');
  s.setAttribute('data-dmcn', 'avatar');
  s.textContent = `
.dmcn-avatar{
  position:relative;display:inline-flex;align-items:center;justify-content:center;
  font-family:var(--font-sans);font-weight:var(--weight-semibold);color:#fff;
  border-radius:var(--radius-sm);overflow:visible;flex:none;text-transform:uppercase;
  background:var(--brand);user-select:none;
}
.dmcn-avatar img{width:100%;height:100%;object-fit:cover;border-radius:var(--radius-sm);}
.dmcn-avatar--xs{width:24px;height:24px;font-size:10px;}
.dmcn-avatar--sm{width:32px;height:32px;font-size:12px;}
.dmcn-avatar--md{width:40px;height:40px;font-size:15px;}
.dmcn-avatar--lg{width:56px;height:56px;font-size:20px;}
`;
  document.head.appendChild(s);
}

/* Deterministic tint from name so avatars are stable & varied. */
const TINTS = ['#0E9E86', '#2D7FF0', '#7A5AF0', '#C7860B', '#D33C3C', '#1F9D57', '#0A8270', '#C24FA0'];
function tintFor(name = ''): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}
function initials(name = ''): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[parts.length - 1][0];
}

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Display name — drives initials and tint when no src. */
  name?: string;
  /** Image URL; falls back to initials if omitted. */
  src?: string | null;
  /** @default "md" */
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

/**
 * Square avatar with image or auto initials + deterministic tint.
 */
export function Avatar({
  name = '',
  src = null,
  size = 'md',
  className = '',
  style = {},
  ...rest
}: AvatarProps): React.ReactElement {
  ensureAvatarStyles();
  const cls = ['dmcn-avatar', `dmcn-avatar--${size}`, className].filter(Boolean).join(' ');
  const bg = src ? undefined : tintFor(name);
  return (
    <span className={cls} style={{ background: bg, ...style }} title={name || undefined} {...rest}>
      {src ? <img src={src} alt={name} /> : initials(name)}
    </span>
  );
}
