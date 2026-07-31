import { Label } from '@/components/ui/label';

/**
 * Labelled field wrapper shared by every class sheet (hand-written + data-driven ClassSheet).
 *
 * MUST stay at module scope. Each sheet used to declare its own identical copy INSIDE its
 * component body, which makes it a brand-new component type on every render — React then
 * unmounts and remounts the whole subtree, destroying local state in anything it wraps
 * (a half-typed custom instrument, an open subclass dialog). See the nested-component
 * guard in src/test/noNestedComponents.test.js.
 */
export default function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
