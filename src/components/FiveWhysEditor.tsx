import { useAppDispatch, useAppSelector } from '@/store';
import { setFiveWhys } from '@/store/investigationSlice';
import { Plus, Trash2, Target } from 'lucide-react';
import type { FiveWhy } from '@/types';

export function FiveWhysEditor() {
  const dispatch = useAppDispatch();
  const whys = useAppSelector((s) => s.investigation.current?.five_whys ?? []);

  const update = (index: number, field: keyof FiveWhy, value: string | boolean) => {
    const updated = whys.map((w, i) => (i === index ? { ...w, [field]: value } : w));
    dispatch(setFiveWhys(updated));
  };

  const add = () => {
    dispatch(setFiveWhys([...whys, { step_number: whys.length + 1, question: '', answer: '', is_root_cause: false }]));
  };

  const remove = (index: number) => {
    const updated = whys.filter((_, i) => i !== index).map((w, i) => ({ ...w, step_number: i + 1 }));
    dispatch(setFiveWhys(updated));
  };

  return (
    <div className="space-y-3">
      {whys.length === 0 && (
        <p className="py-6 text-center text-xs text-slate-400">
          No 5 Whys analysis yet. Click "Add Why" to start, or use the AI panel to auto-generate.
        </p>
      )}

      {whys.map((why, i) => (
        <div
          key={i}
          className={`rounded-lg border p-3 transition-colors ${
            why.is_root_cause ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] text-white">
                {why.step_number}
              </span>
              Why #{why.step_number}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const updated = whys.map((w, idx) => ({ ...w, is_root_cause: idx === i }));
                  dispatch(setFiveWhys(updated));
                }}
                className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                  why.is_root_cause
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <Target className="h-3 w-3" />
                Root Cause
              </button>
              <button onClick={() => remove(i)} className="text-slate-400 hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <input
              value={why.question}
              onChange={(e) => update(i, 'question', e.target.value)}
              placeholder="Why did this happen?"
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <textarea
              value={why.answer}
              onChange={(e) => update(i, 'answer', e.target.value)}
              placeholder="Answer / finding..."
              rows={2}
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      ))}

      <button
        onClick={add}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-600"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Why
      </button>
    </div>
  );
}
