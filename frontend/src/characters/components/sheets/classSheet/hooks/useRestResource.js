/**
 * useRestResource — resolves a class config's `restResources` list against the current
 * level and character_data into renderable rows.
 *
 * Rest-rechargeable features are spent via a Use button (see RestResourceTracker) and
 * restored only by a GM-triggered rest (backend `_compute_rest_patch`) — never a raw
 * editable value.
 *
 * Config entry shape:
 *   { key, label: string|((level, ctx)=>string), total: (level, ctx)=>number,
 *     recharge: 'short'|'long', minLevel?: number, subclass?: string, description?: string }
 *   — description is a short "what it does" line shown under the label; `subclass` limits the
 *     resource to characters of that subclass (Arcane Archer's Arcane Shot uses), so a
 *     subclass pool costs a data entry rather than a bespoke panel.
 *   — `total` also receives a context `{ scores, data }` because a pool is not always sized by
 *     level: the Cavalier's Unwavering Mark and Warding Maneuver hold Strength- and
 *     Constitution-modifier uses. The backend's _INITIATIVE_RESOURCES already passes a pool
 *     context to its callables for the same reason; this matches that shape.
 *
 * @param {object} opts
 * @param {Array}  opts.resources  config restResources
 * @param {number} opts.level
 * @param {object} opts.data       character_data (reads `<key>_used` and `subclass`)
 * @param {object} opts.scores     ability scores, for ability-derived pool sizes
 * @returns {Array<{ key, label, recharge, total, used, remaining }>}  visible rows only
 */
export function useRestResource({ resources = [], level = 1, data = {}, scores = {} }) {
  return resources
    .filter((r) => level >= (r.minLevel ?? 1))
    .filter((r) => !r.subclass || r.subclass === data.subclass)
    .map((r) => {
      const total = typeof r.total === 'function' ? r.total(level, { scores, data }) : r.total;
      // `label` takes the same treatment as `total` for the same reason: a pool's NAME is not
      // always constant either. The Psi Warrior's Psionic Energy die grows d6 → d12 with level,
      // and the die size is the thing a player reads off the row.
      const label = typeof r.label === 'function' ? r.label(level, { scores, data }) : r.label;
      const used = data[r.key] ?? 0;
      return {
        key: r.key,
        label,
        description: r.description,
        recharge: r.recharge,
        total,
        used,
        remaining: Math.max(0, total - used),
      };
    })
    .filter((r) => r.total > 0);
}

export default useRestResource;
