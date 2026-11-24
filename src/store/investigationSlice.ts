import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';
import type {
  Investigation,
  InvestigationDetail,
  FiveWhy,
  FishboneCategory,
  RootCause,
  EvidenceGap,
  Capa,
} from '@/types';

interface InvestigationState {
  list: Investigation[];
  current: InvestigationDetail | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: InvestigationState = {
  list: [],
  current: null,
  loading: false,
  saving: false,
  error: null,
};

function emptyDetail(): InvestigationDetail {
  return {
    id: '',
    title: '',
    deviation_number: null,
    product_name: '',
    batch_number: '',
    deviation_date: null,
    deviation_description: '',
    deviation_category: '',
    severity: 'Minor',
    process_step: '',
    equipment_involved: '',
    material_impact: '',
    initial_risk_assessment: '',
    investigation_method: '5 Whys',
    status: 'draft',
    source_type: 'text',
    source_content: '',
    created_at: '',
    updated_at: '',
    five_whys: [],
    fishbone: [],
    root_causes: [],
    evidence_gaps: [],
    capas: [],
  };
}

export const fetchInvestigations = createAsyncThunk('investigation/fetchAll', async () => {
  const { data, error } = await supabase
    .from('investigations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Investigation[];
});

export const fetchInvestigationById = createAsyncThunk('investigation/fetchById', async (id: string) => {
  const [invRes, fiveWhysRes, fishboneRes, rootCausesRes, gapsRes, capasRes] = await Promise.all([
    supabase.from('investigations').select('*').eq('id', id).maybeSingle(),
    supabase.from('five_whys').select('*').eq('investigation_id', id).order('step_number', { ascending: true }),
    supabase.from('fishbone_categories').select('*').eq('investigation_id', id),
    supabase.from('root_causes').select('*').eq('investigation_id', id),
    supabase.from('evidence_gaps').select('*').eq('investigation_id', id),
    supabase.from('capas').select('*').eq('investigation_id', id),
  ]);

  if (invRes.error) throw invRes.error;
  if (!invRes.data) return null;

  return {
    ...invRes.data,
    five_whys: fiveWhysRes.data ?? [],
    fishbone: fishboneRes.data ?? [],
    root_causes: rootCausesRes.data ?? [],
    evidence_gaps: gapsRes.data ?? [],
    capas: capasRes.data ?? [],
  } as InvestigationDetail;
});

export const saveInvestigation = createAsyncThunk(
  'investigation/save',
  async (detail: InvestigationDetail) => {
    const { id, five_whys, fishbone, root_causes, evidence_gaps, capas, created_at, updated_at, ...fields } = detail;
    const isNew = !id;

    let investigationId = id;

    if (isNew) {
      const { data, error } = await supabase
        .from('investigations')
        .insert({ ...fields })
        .select()
        .single();
      if (error) throw error;
      investigationId = data.id;
    } else {
      const { error } = await supabase
        .from('investigations')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;

      // Delete existing child records for replacement
      await Promise.all([
        supabase.from('five_whys').delete().eq('investigation_id', id),
        supabase.from('fishbone_categories').delete().eq('investigation_id', id),
        supabase.from('root_causes').delete().eq('investigation_id', id),
        supabase.from('evidence_gaps').delete().eq('investigation_id', id),
        supabase.from('capas').delete().eq('investigation_id', id),
      ]);
    }

    // Insert child records
    const inserts: Promise<unknown>[] = [];

    if (five_whys.length > 0) {
      inserts.push(
        supabase.from('five_whys').insert(
          five_whys.map((w) => ({
            investigation_id: investigationId,
            step_number: w.step_number,
            question: w.question,
            answer: w.answer,
            is_root_cause: w.is_root_cause,
          })),
        ),
      );
    }

    if (fishbone.length > 0) {
      inserts.push(
        supabase.from('fishbone_categories').insert(
          fishbone.map((f) => ({
            investigation_id: investigationId,
            category: f.category,
            causes: JSON.stringify(f.causes),
          })),
        ),
      );
    }

    if (root_causes.length > 0) {
      inserts.push(
        supabase.from('root_causes').insert(
          root_causes.map((r) => ({
            investigation_id: investigationId,
            description: r.description,
            category: r.category,
            contributing_factors: JSON.stringify(r.contributing_factors),
            confidence: r.confidence,
            evidence_summary: r.evidence_summary,
            confirmed: r.confirmed,
          })),
        ),
      );
    }

    if (evidence_gaps.length > 0) {
      inserts.push(
        supabase.from('evidence_gaps').insert(
          evidence_gaps.map((g) => ({
            investigation_id: investigationId,
            description: g.description,
            significance: g.significance,
            status: g.status,
          })),
        ),
      );
    }

    if (capas.length > 0) {
      inserts.push(
        supabase.from('capas').insert(
          capas.map((c) => ({
            investigation_id: investigationId,
            type: c.type,
            description: c.description,
            rationale: c.rationale,
            owner: c.owner,
            target_date: c.target_date,
            status: c.status,
          })),
        ),
      );
    }

    await Promise.all(inserts);

    return { ...detail, id: investigationId } as InvestigationDetail;
  },
);

const investigationSlice = createSlice({
  name: 'investigation',
  initialState,
  reducers: {
    clearCurrent(state) {
      state.current = null;
      state.error = null;
    },
    startNewInvestigation(state) {
      state.current = emptyDetail();
      state.error = null;
    },
    updateField<K extends keyof InvestigationDetail>(
      state,
      action: PayloadAction<{ field: K; value: InvestigationDetail[K] }>,
    ) {
      if (state.current) {
        state.current[action.payload.field] = action.payload.value;
      }
    },
    setFiveWhys(state, action: PayloadAction<FiveWhy[]>) {
      if (state.current) state.current.five_whys = action.payload;
    },
    setFishbone(state, action: PayloadAction<FishboneCategory[]>) {
      if (state.current) state.current.fishbone = action.payload;
    },
    setRootCauses(state, action: PayloadAction<RootCause[]>) {
      if (state.current) state.current.root_causes = action.payload;
    },
    setEvidenceGaps(state, action: PayloadAction<EvidenceGap[]>) {
      if (state.current) state.current.evidence_gaps = action.payload;
    },
    setCapas(state, action: PayloadAction<Capa[]>) {
      if (state.current) state.current.capas = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvestigations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvestigations.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchInvestigations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load investigations';
      })
      .addCase(fetchInvestigationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvestigationById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchInvestigationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load investigation';
      })
      .addCase(saveInvestigation.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveInvestigation.fulfilled, (state, action) => {
        state.saving = false;
        state.current = action.payload;
      })
      .addCase(saveInvestigation.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? 'Failed to save investigation';
      });
  },
});

export const {
  clearCurrent,
  startNewInvestigation,
  updateField,
  setFiveWhys,
  setFishbone,
  setRootCauses,
  setEvidenceGaps,
  setCapas,
} = investigationSlice.actions;

export default investigationSlice.reducer;
