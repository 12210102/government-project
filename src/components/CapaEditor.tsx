import { useAppDispatch, useAppSelector } from '@/store';
import { setCapas } from '@/store/investigationSlice';
import { Plus, Trash2, Wrench, Shield } from 'lucide-react';
import {
  CAPA_TYPE_COLORS,
  CAPA_STATUS_LABELS,
  CAPA_STATUS_COLORS,
  type Capa,
  type CapaType,
  type CapaStatus,
} from '@/types';

export function CapaEditor() {
  const dispatch = useAppDispatch();
  const capas = useAppSelector((s) => s.investigation.current?.capas ?? []);

  const add = (type: CapaType) => {
    dispatch(
      setCapas([
        ...capas,
        { type, description: '', rationale: '', owner: '', target_date: null, status: 'proposed' },
      ]),
    );
  };

  const update = (index: number, field: keyof Capa, value: string | null) => {
    const updated = capas.map((c, i) => (i === index ? { ...c, [field]: value } : c));
    dispatch(setCapas(updated));
  };

  const remove = (index: number) => {
    dispatch(setCapas(capas.filter((_, i) => i !== index)));
  };

  const corrective = capas.filter((c) => c.type === 'corrective');
  const preventive = capas.filter((c) => c.type === 'preventive');

  return (
    <div className="space-y-5">
      {/* Corrective Actions */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <Wrench className="h-4 w-4 text-blue-600" />
            Corrective Actions
            <span className="text-xs font-normal text-slate-400">({corrective.length})</span>
          </h4>
          <button
            onClick={() => add('corrective')}
            className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>
        <div className="space-y-2">
          {corrective.length === 0 && (
            <p className="py-3 text-center text-xs text-slate-400">No corrective actions yet.</p>
          )}
          {corrective.map((capa) => {
            const realIndex = capas.indexOf(capa);
            return <CapaCard key={realIndex} capa={capa} index={realIndex} onUpdate={update} onRemove={remove} />;
          })}
        </div>
      </div>

      {/* Preventive Actions */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <Shield className="h-4 w-4 text-teal-600" />
            Preventive Actions
            <span className="text-xs font-normal text-slate-400">({preventive.length})</span>
          </h4>
          <button
            onClick={() => add('preventive')}
            className="flex items-center gap-1 rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-600 hover:bg-teal-100"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>
        <div className="space-y-2">
          {preventive.length === 0 && (
            <p className="py-3 text-center text-xs text-slate-400">No preventive actions yet.</p>
          )}
          {preventive.map((capa) => {
            const realIndex = capas.indexOf(capa);
            return <CapaCard key={realIndex} capa={capa} index={realIndex} onUpdate={update} onRemove={remove} />;
          })}
        </div>
      </div>
    </div>
  );
}

function CapaCard({
  capa,
  index,
  onUpdate,
  onRemove,
}: {
  capa: Capa;
  index: number;
  onUpdate: (index: number, field: keyof Capa, value: string | null) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className={`rounded-lg border p-3 ${CAPA_TYPE_COLORS[capa.type]}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${CAPA_TYPE_COLORS[capa.type]}`}>
          {capa.type === 'corrective' ? 'Corrective' : 'Preventive'}
        </span>
        <div className="flex items-center gap-2">
          <select
            value={capa.status}
            onChange={(e) => onUpdate(index, 'status', e.target.value as CapaStatus)}
            className={`rounded-md border px-2 py-0.5 text-[11px] font-medium focus:outline-none ${CAPA_STATUS_COLORS[capa.status]}`}
          >
            {Object.entries(CAPA_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
          <button onClick={() => onRemove(index)} className="text-slate-400 hover:text-red-500">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <textarea
          value={capa.description}
          onChange={(e) => onUpdate(index, 'description', e.target.value)}
          placeholder="Action description..."
          rows={2}
          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <textarea
          value={capa.rationale}
          onChange={(e) => onUpdate(index, 'rationale', e.target.value)}
          placeholder="Rationale / explanation..."
          rows={2}
          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-600 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={capa.owner}
            onChange={(e) => onUpdate(index, 'owner', e.target.value)}
            placeholder="Owner / department"
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="date"
            value={capa.target_date ?? ''}
            onChange={(e) => onUpdate(index, 'target_date', e.target.value || null)}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
