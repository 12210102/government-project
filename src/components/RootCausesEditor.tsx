import { useAppDispatch, useAppSelector } from '@/store';
import { setRootCauses } from '@/store/investigationSlice';
import { Plus, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Badge, Button } from './ui';
import { CONFIDENCE_COLORS, type RootCause, type Confidence } from '@/types';

export function RootCausesEditor() {
  const dispatch = useAppDispatch();
  const rootCauses = useAppSelector((s) => s.investigation.current?.root_causes ?? []);

  const add = () => {
    dispatch(
      setRootCauses([
        ...rootCauses,
        {
          description: '',
          category: '',
          contributing_factors: [],
          confidence: 'Medium',
          evidence_summary: '',
          confirmed: false,
        },
      ]),
    );
  };

  const update = (index: number, field: keyof RootCause, value: unknown) => {
    const updated = rootCauses.map((rc, i) => (i === index ? { ...rc, [field]: value } : rc));
    dispatch(setRootCauses(updated));
  };

  const remove = (index: number) => {
    dispatch(setRootCauses(rootCauses.filter((_, i) => i !== index)));
  };

  const toggleConfirm = (index: number) => {
    update(index, 'confirmed', !rootCauses[index].confirmed);
  };

  return (
    <div className="space-y-3">
      {rootCauses.length === 0 && (
        <p className="py-6 text-center text-xs text-slate-400">
          No root causes identified yet. Use the AI panel to generate suggestions, or add manually.
        </p>
      )}

      {rootCauses.map((rc, i) => (
        <div
          key={i}
          className={`rounded-lg border p-4 transition-colors ${
            rc.confirmed ? 'border-emerald-300 bg-emerald-50' : 'border-amber-200 bg-amber-50/50'
          }`}
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Badge className={CONFIDENCE_COLORS[rc.confidence]}>
                {rc.confidence} confidence
              </Badge>
              {rc.confirmed ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Confirmed
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  AI Suggestion
                </Badge>
              )}
            </div>
            <button onClick={() => remove(i)} className="text-slate-400 hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Root Cause Description</label>
              <textarea
                value={rc.description}
                onChange={(e) => update(i, 'description', e.target.value)}
                placeholder="Describe the identified root cause..."
                rows={2}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Category</label>
                <input
                  value={rc.category}
                  onChange={(e) => update(i, 'category', e.target.value)}
                  placeholder="e.g. Equipment, Training, Procedure"
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Confidence Level</label>
                <select
                  value={rc.confidence}
                  onChange={(e) => update(i, 'confidence', e.target.value as Confidence)}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Contributing Factors</label>
              <input
                value={rc.contributing_factors.join('; ')}
                onChange={(e) => update(i, 'contributing_factors', e.target.value.split(';').map((s) => s.trim()).filter(Boolean))}
                placeholder="Separate factors with semicolons..."
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Evidence Summary</label>
              <textarea
                value={rc.evidence_summary}
                onChange={(e) => update(i, 'evidence_summary', e.target.value)}
                placeholder="Summary of supporting evidence..."
                rows={2}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <Button
              variant={rc.confirmed ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => toggleConfirm(i)}
              className="w-full"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {rc.confirmed ? 'Unconfirm' : 'Confirm as Verified Root Cause'}
            </Button>
          </div>
        </div>
      ))}

      <button
        onClick={add}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-600"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Root Cause
      </button>
    </div>
  );
}
