import { useAppDispatch, useAppSelector } from '@/store';
import { setFishbone } from '@/store/investigationSlice';
import { Plus, Trash2, Fish } from 'lucide-react';
import { FISHBONE_CATEGORIES, type FishboneCategory, type FishboneCause } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  Methods: 'border-blue-200 bg-blue-50',
  Machines: 'border-purple-200 bg-purple-50',
  Materials: 'border-emerald-200 bg-emerald-50',
  Manpower: 'border-amber-200 bg-amber-50',
  Measurement: 'border-cyan-200 bg-cyan-50',
  Environment: 'border-teal-200 bg-teal-50',
};

const CATEGORY_DOT: Record<string, string> = {
  Methods: 'bg-blue-500',
  Machines: 'bg-purple-500',
  Materials: 'bg-emerald-500',
  Manpower: 'bg-amber-500',
  Measurement: 'bg-cyan-500',
  Environment: 'bg-teal-500',
};

export function FishboneEditor() {
  const dispatch = useAppDispatch();
  const fishbone = useAppSelector((s) => s.investigation.current?.fishbone ?? []);

  const ensureCategory = (cat: string) => {
    if (!fishbone.find((f) => f.category === cat)) {
      dispatch(setFishbone([...fishbone, { category: cat, causes: [] }]));
    }
  };

  const updateCategory = (cat: string, causes: FishboneCause[]) => {
    const existing = fishbone.find((f) => f.category === cat);
    if (existing) {
      const updated = fishbone.map((f) => (f.category === cat ? { ...f, causes } : f));
      dispatch(setFishbone(updated));
    } else {
      dispatch(setFishbone([...fishbone, { category: cat, causes }]));
    }
  };

  const addCause = (cat: string) => {
    const entry = fishbone.find((f) => f.category === cat);
    const causes = entry?.causes ?? [];
    updateCategory(cat, [...causes, { cause: '', evidence: '' }]);
  };

  const updateCause = (cat: string, index: number, field: keyof FishboneCause, value: string) => {
    const entry = fishbone.find((f) => f.category === cat);
    if (!entry) return;
    const causes = entry.causes.map((c, i) => (i === index ? { ...c, [field]: value } : c));
    updateCategory(cat, causes);
  };

  const removeCause = (cat: string, index: number) => {
    const entry = fishbone.find((f) => f.category === cat);
    if (!entry) return;
    updateCategory(cat, entry.causes.filter((_, i) => i !== index));
  };

  const removeCategory = (cat: string) => {
    dispatch(setFishbone(fishbone.filter((f) => f.category !== cat)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        <Fish className="h-4 w-4 text-slate-400" />
        Fishbone (Ishikawa) analysis organizes potential causes into 6 categories. Click a category to add causes.
      </div>

      {fishbone.length === 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FISHBONE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => ensureCategory(cat)}
              className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-xs font-medium text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-600"
            >
              <span className={`h-2 w-2 rounded-full ${CATEGORY_DOT[cat]}`} />
              {cat}
              <Plus className="ml-auto h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      {fishbone.map((entry: FishboneCategory) => (
        <div key={entry.category} className={`rounded-lg border p-3 ${CATEGORY_COLORS[entry.category] ?? 'border-slate-200 bg-white'}`}>
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span className={`h-2.5 w-2.5 rounded-full ${CATEGORY_DOT[entry.category]}`} />
              {entry.category}
            </span>
            <button onClick={() => removeCategory(entry.category)} className="text-slate-400 hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {entry.causes.map((c, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <input
                    value={c.cause}
                    onChange={(e) => updateCause(entry.category, i, 'cause', e.target.value)}
                    placeholder="Potential cause..."
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    value={c.evidence}
                    onChange={(e) => updateCause(entry.category, i, 'evidence', e.target.value)}
                    placeholder="Supporting evidence or reasoning..."
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-500 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button onClick={() => removeCause(entry.category, i)} className="mt-1 text-slate-400 hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={() => addCause(entry.category)}
              className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 py-1.5 text-[11px] font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600"
            >
              <Plus className="h-3 w-3" />
              Add Cause
            </button>
          </div>
        </div>
      ))}

      {fishbone.length > 0 && fishbone.length < FISHBONE_CATEGORIES.length && (
        <div className="flex flex-wrap gap-2">
          {FISHBONE_CATEGORIES.filter((c) => !fishbone.find((f) => f.category === c)).map((cat) => (
            <button
              key={cat}
              onClick={() => ensureCategory(cat)}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-2.5 py-1.5 text-[11px] font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600"
            >
              <Plus className="h-3 w-3" />
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
