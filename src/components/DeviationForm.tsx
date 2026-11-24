import { useAppDispatch, useAppSelector } from '@/store';
import { updateField } from '@/store/investigationSlice';
import { Input, Textarea, Select } from './ui';
import {
  DEVIATION_CATEGORIES,
  SEVERITIES,
  type InvestigationMethod,
} from '@/types';

export function DeviationForm() {
  const dispatch = useAppDispatch();
  const inv = useAppSelector((s) => s.investigation.current);
  if (!inv) return null;

  const set = <K extends keyof typeof inv>(field: K, value: (typeof inv)[K]) => {
    dispatch(updateField({ field, value }));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Deviation Title"
          value={inv.title}
          onChange={(v) => set('title', v)}
          placeholder="e.g. Crystallization temperature excursion in reactor R-105"
          required
        />
        <Input
          label="Deviation Number"
          value={inv.deviation_number ?? ''}
          onChange={(v) => set('deviation_number', v)}
          placeholder="Auto-assigned if left blank"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Product / API Name"
          value={inv.product_name}
          onChange={(v) => set('product_name', v)}
          placeholder="e.g. Ibuprofen API"
        />
        <Input
          label="Batch Number"
          value={inv.batch_number}
          onChange={(v) => set('batch_number', v)}
          placeholder="e.g. PRD-2026-0342"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Deviation Date"
          type="date"
          value={inv.deviation_date ?? ''}
          onChange={(v) => set('deviation_date', v || null)}
        />
        <Select
          label="Category"
          value={inv.deviation_category || 'Other'}
          onChange={(v) => set('deviation_category', v)}
          options={DEVIATION_CATEGORIES}
        />
        <Select
          label="Severity"
          value={inv.severity}
          onChange={(v) => set('severity', v as typeof inv.severity)}
          options={SEVERITIES}
        />
      </div>

      <Input
        label="Process Step"
        value={inv.process_step}
        onChange={(v) => set('process_step', v)}
        placeholder="e.g. Crystallization step 3"
      />

      <Input
        label="Equipment Involved"
        value={inv.equipment_involved}
        onChange={(v) => set('equipment_involved', v)}
        placeholder="e.g. Reactor R-105, Cooling jacket, Temperature sensor TIC-210"
      />

      <Textarea
        label="Deviation Description"
        value={inv.deviation_description}
        onChange={(v) => set('deviation_description', v)}
        placeholder="Detailed description of what happened, when, and how it was discovered..."
        rows={4}
      />

      <Textarea
        label="Material / Batch Impact"
        value={inv.material_impact}
        onChange={(v) => set('material_impact', v)}
        placeholder="Impact on the batch, materials, or product quality..."
        rows={3}
      />

      <Textarea
        label="Initial Risk Assessment"
        value={inv.initial_risk_assessment}
        onChange={(v) => set('initial_risk_assessment', v)}
        placeholder="Initial assessment of risk to product quality, patient safety, and regulatory compliance..."
        rows={3}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Investigation Method"
          value={inv.investigation_method}
          onChange={(v) => set('investigation_method', v as InvestigationMethod)}
          options={['5 Whys', 'Fishbone']}
        />
        <Select
          label="Status"
          value={inv.status}
          onChange={(v) => set('status', v as typeof inv.status)}
          options={['draft', 'in_progress', 'under_review', 'closed']}
        />
      </div>
    </div>
  );
}
