import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import OptionCardPicker from '@/characters/components/shared/OptionCardPicker';
import SubclassOverview from '@/characters/components/subclass/SubclassOverview';

/**
 * Drop-in replacement for OptionCardPicker used in subclass selection sections.
 * Adds an info button per card that opens a SubclassOverview dialog.
 *
 * Props:
 *   options:    Array of { value, description }
 *   value:      currently selected subclass name
 *   onChange:   (value: string) => void
 *   className:  D&D class name, e.g. 'Barbarian'
 *   edition:    '5e' | '5.5e'
 */
export default function SubclassPickerWithDetail({ options, value, onChange, className, edition }) {
  const [detailSubclass, setDetailSubclass] = useState(null);

  return (
    <>
      <OptionCardPicker
        options={options}
        value={value}
        onChange={onChange}
        onDetailClick={setDetailSubclass}
      />

      <Dialog open={!!detailSubclass} onOpenChange={open => !open && setDetailSubclass(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">{detailSubclass} details</DialogTitle>
          </DialogHeader>
          {detailSubclass && (
            <SubclassOverview
              className={className}
              subclassName={detailSubclass}
              edition={edition}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
