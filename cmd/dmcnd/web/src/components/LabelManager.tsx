import { useState } from 'react';
import { useLabels, LABEL_COLORS } from '../lib/hooks/useLabels';
import { Dialog, Button, Input, IconButton } from '../ds';
import { Icon } from './Icon';

// LabelManager is the create/rename/delete UI for label + folder definitions. It
// writes to the "settings/labels" doc (via useLabels, compare-and-swap). Assignment to
// messages happens in the reader; this only names them. Deleting a definition removes
// it from every view automatically (unknown ids are ignored) — no per-message cleanup.

// Identifies the row currently being renamed inline (null ⇒ nothing is being edited).
type Editing = { kind: 'label' | 'folder'; id: string } | null;

export function LabelManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { labels, folders, createLabel, renameLabel, deleteLabel, createFolder, renameFolder, deleteFolder } = useLabels();
  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState(LABEL_COLORS[0]);
  const [folderName, setFolderName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Inline-rename state: which row is open, plus the draft name/color for it.
  const [editing, setEditing] = useState<Editing>(null);
  const [draftName, setDraftName] = useState('');
  const [draftColor, setDraftColor] = useState(LABEL_COLORS[0]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };

  const addLabel = () => {
    const n = labelName.trim();
    if (!n) return;
    void run(async () => { await createLabel(n, labelColor); setLabelName(''); });
  };
  const addFolder = () => {
    const n = folderName.trim();
    if (!n) return;
    void run(async () => { await createFolder(n); setFolderName(''); });
  };

  const startEditLabel = (id: string, name: string, color: string) => {
    setEditing({ kind: 'label', id }); setDraftName(name); setDraftColor(color); setError('');
  };
  const startEditFolder = (id: string, name: string) => {
    setEditing({ kind: 'folder', id }); setDraftName(name); setError('');
  };
  const cancelEdit = () => setEditing(null);
  const saveEdit = () => {
    const n = draftName.trim();
    if (!editing || !n) return;
    const e = editing;
    void run(async () => {
      if (e.kind === 'label') await renameLabel(e.id, n, draftColor);
      else await renameFolder(e.id, n);
      setEditing(null);
    });
  };

  const rowStyle = { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) 0' } as const;

  // The color-swatch picker, shared by the create form and label rename.
  const colorPicker = (selected: string, onPick: (c: string) => void) => (
    <div style={{ display: 'flex', gap: 4 }}>
      {LABEL_COLORS.map(c => (
        <button key={c} aria-label={`Color ${c}`} onClick={() => onPick(c)}
          style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: selected === c ? '2px solid var(--text-strong)' : '2px solid transparent', cursor: 'pointer', padding: 0 }} />
      ))}
    </div>
  );

  return (
    <Dialog open={open} onClose={onClose} title="Labels & folders"
      footer={<Button variant="secondary" onClick={onClose}>Done</Button>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', minWidth: 320 }}>
        {error && (
          <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--danger-subtle)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>{error}</div>
        )}

        {/* Labels */}
        <section>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-strong)', marginBottom: 'var(--space-2)' }}>Labels</div>
          {labels.length === 0 && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No labels yet.</div>}
          {labels.map(l => (
            editing?.kind === 'label' && editing.id === l.id ? (
              <div key={l.id} style={{ ...rowStyle, flexWrap: 'wrap' }}>
                <Input value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="Label name" autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} style={{ flex: 1, minWidth: 140 }} />
                {colorPicker(draftColor, setDraftColor)}
                <IconButton size="sm" aria-label="Save label" disabled={busy || !draftName.trim()} onClick={saveEdit}><Icon name="check" size={15} /></IconButton>
                <IconButton size="sm" aria-label="Cancel rename" disabled={busy} onClick={cancelEdit}><Icon name="x" size={15} /></IconButton>
              </div>
            ) : (
              <div key={l.id} style={rowStyle}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, flex: 'none' }} />
                <span style={{ flex: 1, fontSize: 'var(--text-md)', color: 'var(--text-strong)' }}>{l.name}</span>
                <IconButton size="sm" aria-label={`Rename label ${l.name}`} disabled={busy} onClick={() => startEditLabel(l.id, l.name, l.color)}><Icon name="pencil" size={15} /></IconButton>
                <IconButton size="sm" aria-label={`Delete label ${l.name}`} disabled={busy} onClick={() => void run(() => deleteLabel(l.id))}><Icon name="trash" size={15} /></IconButton>
              </div>
            )
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            {colorPicker(labelColor, setLabelColor)}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <Input value={labelName} onChange={e => setLabelName(e.target.value)} placeholder="New label name"
              onKeyDown={e => { if (e.key === 'Enter') addLabel(); }} style={{ flex: 1 }} />
            <Button variant="secondary" disabled={busy || !labelName.trim()} onClick={addLabel}>Add</Button>
          </div>
        </section>

        {/* Folders */}
        <section>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-strong)', marginBottom: 'var(--space-2)' }}>Folders</div>
          {folders.length === 0 && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No folders yet.</div>}
          {folders.map(f => (
            editing?.kind === 'folder' && editing.id === f.id ? (
              <div key={f.id} style={rowStyle}>
                <Icon name="archive" size={15} style={{ color: 'var(--text-muted)', flex: 'none' }} />
                <Input value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="Folder name" autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} style={{ flex: 1 }} />
                <IconButton size="sm" aria-label="Save folder" disabled={busy || !draftName.trim()} onClick={saveEdit}><Icon name="check" size={15} /></IconButton>
                <IconButton size="sm" aria-label="Cancel rename" disabled={busy} onClick={cancelEdit}><Icon name="x" size={15} /></IconButton>
              </div>
            ) : (
              <div key={f.id} style={rowStyle}>
                <Icon name="archive" size={15} style={{ color: 'var(--text-muted)', flex: 'none' }} />
                <span style={{ flex: 1, fontSize: 'var(--text-md)', color: 'var(--text-strong)' }}>{f.name}</span>
                <IconButton size="sm" aria-label={`Rename folder ${f.name}`} disabled={busy} onClick={() => startEditFolder(f.id, f.name)}><Icon name="pencil" size={15} /></IconButton>
                <IconButton size="sm" aria-label={`Delete folder ${f.name}`} disabled={busy} onClick={() => void run(() => deleteFolder(f.id))}><Icon name="trash" size={15} /></IconButton>
              </div>
            )
          ))}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <Input value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="New folder name"
              onKeyDown={e => { if (e.key === 'Enter') addFolder(); }} style={{ flex: 1 }} />
            <Button variant="secondary" disabled={busy || !folderName.trim()} onClick={addFolder}>Add</Button>
          </div>
        </section>
      </div>
    </Dialog>
  );
}
