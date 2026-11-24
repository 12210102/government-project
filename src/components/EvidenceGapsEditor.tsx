import { useAppDispatch, useAppSelector } from '@/store';
import { setEvidenceGaps } from '@/store/investigationSlice';
import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GAP_SIGNIFICANCE_COLORS, type EvidenceGap, type GapSignificance, type GapStatus } from '@/types';

export function EvidenceGapsEditor() {
  const dispatch = useAppDispatch();
  const gaps = useAppSelector((s) => s.investigation.current?.evidence_gaps ?? []);

  const add = () => {
    dispatch(
      setEvidenceGaps([...gaps, { description: '', significance: 'Medium', status: 'open' }]),
    );
  };

  const update = (index: number, field: keyof EvidenceGap, value: string) => {
    const updated = gaps.map((g, i) => (i === index ? { ...g, [field]: value } : g));
    dispatch(setEvidenceGaps(updated));
  };

  const remove = (index: number) => {
    dispatch(setEvidenceGaps(gaps.filter((_, i) => i !== index)));
  };

  const toggleStatus = (index: number) => {
    update(index, 'status', gaps[index].status === 'open' ? 'resolved' : 'open');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        Evidence gaps are missing information needed to confirm or refute root causes. Address these to strengthen the investigation.
      </div>

      {gaps.length === 0 && (
        <p className="py-6 text-center text-xs text-slate-400">
          No evidence gaps identified. Use the AI panel to detect missing information automatically.
        </p>
      )}

      {gaps.map((gap, i) => (
        <div
          key={i}
          className={`rounded-lg border p-3 transition-colors ${
            gap.status === 'resolved' ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex flex-1 flex-col gap-2">
              <textarea
                value={gap.description}
                onChange={(e) => update(i, 'description', e.target.value)}
                placeholder="What evidence or information is missing?"
                rows={2}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <select
                  value={gap.significance}
                  onChange={(e) => update(i, 'significance', e.target.value as GapSignificance)}
                  className={`rounded-md border px-2 py-1 text-xs font-medium focus:outline-none ${GAP_SIGNIFICANCE_COLORS[gap.significance]}`}
                >
                  <option value="High">High significance</option>
                  <option value="Medium">Medium significance</option>
                  <option value="Low">Low significance</option>
                </select>
                <button
                  onClick={() => toggleStatus(i)}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    gap.status === 'open'
                      ? 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {gap.status === 'resolved' ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  {gap.status === 'open' ? 'Mark Resolved' : 'Resolved'}
                </button>
              </div>
            </div>
            <button onClick={() => remove(i)} className="text-slate-400 hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={add}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-600"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Evidence Gap
      </button>
    </div>
  );
}
