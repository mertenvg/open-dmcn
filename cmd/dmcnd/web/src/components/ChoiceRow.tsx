/**
 * Radio-style selectable card (DS-tokened). Used by the import and device-pairing
 * screens for the "protect on this device" passkey/password choice.
 */
export function ChoiceRow({ checked, onClick, title, desc }: {
  checked: boolean; onClick: () => void; title: string; desc?: string;
}) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', width: '100%', textAlign: 'left',
      padding: 'var(--space-3)', cursor: 'pointer', font: 'inherit',
      background: checked ? 'var(--brand-subtle)' : 'var(--surface-card)',
      border: `1px solid ${checked ? 'var(--brand)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-md)',
    }}>
      <span style={{
        flex: 'none', marginTop: 2, width: 16, height: 16, borderRadius: 'var(--radius-full)',
        border: `1.5px solid ${checked ? 'var(--brand)' : 'var(--border-strong)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <span style={{ width: 8, height: 8, borderRadius: 'var(--radius-full)', background: 'var(--brand)' }} />}
      </span>
      <span>
        <span style={{ display: 'block', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-strong)' }}>{title}</span>
        {desc && <span style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 1 }}>{desc}</span>}
      </span>
    </button>
  );
}
