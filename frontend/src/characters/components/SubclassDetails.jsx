import { SUBCLASS_DATA } from './subclassData';
import { Label } from '@/components/ui/label';

export default function SubclassDetails({ className, edition, subclassName, level }) {
  const editionKey = edition === '5.5e' ? '5.5e' : '5e';
  const subData = SUBCLASS_DATA[className]?.[editionKey]?.[subclassName];

  if (!subData) {
    return <div className="text-sm py-2">{subclassName}</div>;
  }

  const earnedFeatures = subData.features.filter(f => f.level <= level);

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">{subclassName}</div>
      <div className="text-xs text-muted-foreground italic leading-relaxed">{subData.flavorText}</div>
      {earnedFeatures.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Subclass Features</Label>
          {earnedFeatures.map(feat => (
            <div key={feat.name} className="rounded-md border bg-muted/20 p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-muted rounded px-1.5 py-0.5 text-muted-foreground">Lvl {feat.level}</span>
                <div className="font-semibold text-sm">{feat.name}</div>
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">{feat.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
