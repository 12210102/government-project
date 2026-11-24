import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { analyzeSource } from '@/lib/ai';
import type { AIAnalysisResult } from '@/types';

export type AIStep =
  | 'extract'
  | 'five_whys'
  | 'fishbone'
  | 'root_causes'
  | 'evidence_gaps'
  | 'capa'
  | 'done';

interface AIState {
  processing: boolean;
  step: AIStep | null;
  error: string | null;
  result: AIAnalysisResult | null;
}

const initialState: AIState = {
  processing: false,
  step: null,
  error: null,
  result: null,
};

export const runAIAnalysis = createAsyncThunk(
  'ai/analyze',
  async (params: { sourceText: string; sourceType: string }) => {
    return await analyzeSource(params.sourceText, params.sourceType);
  },
);

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    clearResult(state: AIState) {
      state.result = null;
      state.error = null;
      state.step = null;
    },
    setStep(state: AIState, action: PayloadAction<AIStep | null>) {
      state.step = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runAIAnalysis.pending, (state) => {
        state.processing = true;
        state.error = null;
        state.result = null;
        state.step = 'extract';
      })
      .addCase(runAIAnalysis.fulfilled, (state, action) => {
        state.processing = false;
        state.step = 'done';
        state.result = action.payload;
      })
      .addCase(runAIAnalysis.rejected, (state, action) => {
        state.processing = false;
        state.step = null;
        state.error = action.error.message ?? 'AI analysis failed';
      });
  },
});

export const { clearResult, setStep } = aiSlice.actions;
export default aiSlice.reducer;
