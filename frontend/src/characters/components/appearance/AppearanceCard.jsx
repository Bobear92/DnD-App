import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  APPEARANCE_GROUPS, filledAppearanceGroups, hasAppearance, appearanceNotesFor,
} from '@/characters/components/appearance/appearanceData';

/**
 * The character's physical description, in the Narrative tab.
 *
 * Two modes, and the difference matters. In READ mode it shows only the fields that were actually
 * filled in (`filledAppearanceGroups`) — a reader wants the description, not a form with holes in
 * it. In EDIT mode the owner sees every field in the catalog, because you cannot fill in a box you
 * cannot see; that is also why the card does not hide empty fields behind a "show more".
 *
 * Suggestions are a native <datalist>: they fill an empty box for someone who doesn't know where
 * to start, and they never stop anyone typing something else. A closed Select here would be the
 * app telling a player what colour their eyes are allowed to be.
 */

function FieldNote({ note, fieldKey }) {
  return (
    <p
      className="text-[11px] text-amber-600 leading-tight mt-1"
      data-testid={`appearance-note-${fieldKey}-${note.key}`}
    >
      <span className="font-medium">{note.source}</span> — {note.text}
    </p>
  );
}

function EditField({ field, value, onChange, notes }) {
  const listId = field.suggestions ? `appearance-suggestions-${field.key}` : undefined;
  return (
    <div className={field.kind === 'long' ? 'sm:col-span-2' : undefined}>
      <label
        className="text-xs font-medium text-muted-foreground"
        htmlFor={`appearance-${field.key}`}
      >
        {field.label}
      </label>
      {field.kind === 'long' ? (
        <Textarea
          id={`appearance-${field.key}`}
          data-testid={`appearance-input-${field.key}`}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          rows={2}
          className="mt-1 text-sm"
        />
      ) : (
        <>
          <Input
            id={`appearance-${field.key}`}
            data-testid={`appearance-input-${field.key}`}
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            list={listId}
            className="mt-1 h-8 text-sm"
          />
          {field.suggestions && (
            <datalist id={listId} data-testid={`appearance-suggestions-${field.key}`}>
              {field.suggestions.map((s) => <option key={s} value={s} />)}
            </datalist>
          )}
        </>
      )}
      {notes.map((n) => <FieldNote key={n.key} note={n} fieldKey={field.key} />)}
    </div>
  );
}

export default function AppearanceCard({
  appearance = {}, onChange, canEdit = false,
  charClass, subclass, level = 1, edition = '5e',
}) {
  const ctx = { charClass, subclass, level, edition };
  const filled = filledAppearanceGroups(appearance);

  if (!canEdit) {
    if (!hasAppearance(appearance)) {
      return (
        <p className="text-sm text-muted-foreground" data-testid="appearance-empty">
          No description recorded yet.
        </p>
      );
    }
    return (
      <div className="space-y-4" data-testid="appearance-read">
        {filled.map((group) => (
          <div key={group.key} data-testid={`appearance-group-${group.key}`}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              {group.label}
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {group.fields.map((f) => (
                <div
                  key={f.key}
                  className={f.kind === 'long' ? 'sm:col-span-2' : undefined}
                  data-testid={`appearance-value-${f.key}`}
                >
                  <dt className="text-[11px] text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm whitespace-pre-wrap">{appearance[f.key]}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="appearance-edit">
      {APPEARANCE_GROUPS.map((group) => (
        <div key={group.key} data-testid={`appearance-group-${group.key}`}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            {group.label}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            {group.fields.map((f) => (
              <EditField
                key={f.key}
                field={f}
                value={appearance[f.key] ?? ''}
                onChange={onChange}
                notes={appearanceNotesFor(f.key, ctx)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
