import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Coins } from 'lucide-react';
import { coinsForMode, totalInGp, formatGp, EMPTY_WALLET } from './currencyData';

/**
 * Character coin purse. Shows the coins relevant to the campaign currency mode
 * (`mode` = campaign.currency_type: "standard" = pp/gp/sp/cp, "full" = + ep).
 *
 * Props:
 *   currency  { cp, sp, ep, gp, pp }  (from character_data.currency)
 *   mode      campaign.currency_type
 *   onChange  (nextCurrency) => void  — fires the full updated wallet object
 *   readOnly  hides inputs, shows static values
 */
export default function WalletCard({ currency, mode = 'standard', onChange, readOnly = false }) {
  const wallet = { ...EMPTY_WALLET, ...(currency || {}) };
  const coins = coinsForMode(mode);

  const setCoin = (key, raw) => {
    const n = Math.max(0, Math.floor(Number(raw) || 0));
    onChange?.({ ...wallet, [key]: n });
  };

  return (
    <div className="space-y-3" data-testid="wallet-card">
      <div className={cn('grid gap-3', coins.length === 5 ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4')}>
        {coins.map((c) => (
          <div key={c.key} className="rounded-lg border bg-muted/30 p-3 text-center">
            <div className={cn('text-xs font-semibold uppercase tracking-wide mb-1', c.color)}>
              {c.label} <span className="text-muted-foreground">({c.abbr})</span>
            </div>
            {readOnly ? (
              <div className="text-2xl font-bold" data-testid={`wallet-coin-${c.key}`}>
                {wallet[c.key] ?? 0}
              </div>
            ) : (
              <Input
                type="number"
                min="0"
                value={wallet[c.key] ?? 0}
                onChange={(e) => setCoin(c.key, e.target.value)}
                className="h-9 text-center text-lg font-semibold"
                data-testid={`wallet-coin-${c.key}`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Coins className="h-4 w-4" />
        <span>Total value:</span>
        <span className="font-semibold text-foreground" data-testid="wallet-total">
          {formatGp(totalInGp(wallet))} gp
        </span>
      </div>
    </div>
  );
}
