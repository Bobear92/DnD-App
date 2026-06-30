/**
 * CombatBlock — the HP / Hit Dice / AC / Speed region shared by every class sheet.
 * Hidden during creation (HP is auto-calculated; AC/speed depend on equipment).
 * `maxHpNode` / `acExtra` are render slots filled by CharacterDetail.
 */
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import HitDiceTracker from '@/characters/components/combat/HitDiceTracker';
import { getFeatStatMods, getFeatStatModSources } from '@/characters/components/feats/featEffects';
import { hasDurableFeat } from '@/characters/components/combat/combatBonuses';

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function CombatBlock({ hitDie, data = {}, set, readOnly = false, level = 1, creation = false, maxHpNode = null, acExtra = null, conMod = 0, effectiveMaxHp, onHeal }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Max HP">
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-center font-medium">{maxHpNode ?? (data.hp_max ?? '—')}</div>
        </Field>
        <Field label="Current HP">
          <Input type="number" value={data.current_hp ?? ''} onChange={e => set('current_hp', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </Field>
        <Field label="Temp HP">
          <Input type="number" value={data.temp_hp ?? 0} onChange={e => set('temp_hp', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </Field>
      </div>

      <HitDiceTracker
        hitDie={hitDie}
        level={level}
        used={data.hit_dice_used}
        onChange={v => set('hit_dice_used', v)}
        readOnly={readOnly}
        creation={creation}
        conMod={conMod}
        currentHp={data.current_hp}
        maxHp={effectiveMaxHp ?? data.hp_max}
        onHeal={onHeal}
        durable={hasDurableFeat(data.feats)}
      />


      {(() => {
        // Feat speed bonuses (e.g. Mobile +10) fold into Total Speed here — the shared speed
        // renderer — so every data-driven sheet shows the real number.
        const pb = Math.ceil(level / 4) + 1;
        const featSpeed = getFeatStatMods(data.feats, 'speed', { pb });
        const sources = getFeatStatModSources(data.feats, 'speed', { pb });
        const total = (data.speed ?? 30) + (data.speed_bonus ?? 0) + featSpeed;
        return (
          <div className="grid grid-cols-3 gap-3">
            <Field label="Speed (ft)">
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-center font-medium">{data.speed ?? 30}</div>
            </Field>
            <Field label="Speed Bonus (ft)">
              <Input type="number" value={data.speed_bonus ?? 0} onChange={e => set('speed_bonus', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
            </Field>
            <Field label="Total Speed (ft)">
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-center font-medium" data-testid="total-speed">{total}</div>
              {sources.length > 0 && (
                <div className="text-[9px] text-emerald-600 leading-tight text-center" data-testid="total-speed-feat-note">
                  {sources.map((s) => `+${s.amount} ${s.source}`).join(', ')}
                </div>
              )}
            </Field>
          </div>
        );
      })()}
    </>
  );
}
