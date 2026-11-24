import { useState, useRef, useCallback } from 'react';
import {
  FileText,
  Mail,
  Type,
  Sparkles,
  Loader2,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { runAIAnalysis, clearResult } from '@/store/aiSlice';
import { updateField, setFiveWhys, setFishbone, setRootCauses, setEvidenceGaps, setCapas } from '@/store/investigationSlice';
import type { SourceType } from '@/types';

const SOURCE_TABS: { id: SourceType; label: string; icon: typeof FileText }[] = [
  { id: 'text', label: 'Paste Text', icon: Type },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'pdf', label: 'Upload PDF', icon: FileText },
];

export function AIPanel() {
  const dispatch = useAppDispatch();
  const { processing, error, result, step } = useAppSelector((s) => s.ai);
  const [activeTab, setActiveTab] = useState<SourceType>('text');
  const [sourceText, setSourceText] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = useCallback(async () => {
    if (!sourceText.trim()) return;
    await dispatch(runAIAnalysis({ sourceText, sourceType: activeTab }));
  }, [sourceText, activeTab, dispatch]);

  const handleFileUpload = useCallback(async (file: File) => {
    setFileName(file.name);
    const arrayBuffer = await file.arrayBuffer();
    const pdfjs = await import('pdfjs-dist');
    // Use the worker entry point
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item: { str?: string }) => item.str ?? '').join(' ') + '\n';
    }
    setSourceText(fullText);
  }, []);

  const handleApplyResults = useCallback(() => {
    if (!result) return;
    const info = result.extractedInfo;
    dispatch(updateField({ field: 'title', value: info.title ?? '' }));
    dispatch(updateField({ field: 'product_name', value: info.product_name ?? '' }));
    dispatch(updateField({ field: 'batch_number', value: info.batch_number ?? '' }));
    dispatch(updateField({ field: 'deviation_date', value: info.deviation_date ?? null }));
    dispatch(updateField({ field: 'deviation_description', value: info.deviation_description ?? '' }));
    dispatch(updateField({ field: 'deviation_category', value: info.deviation_category ?? '' }));
    dispatch(updateField({ field: 'severity', value: (info.severity as 'Minor' | 'Major' | 'Critical') ?? 'Minor' }));
    dispatch(updateField({ field: 'process_step', value: info.process_step ?? '' }));
    dispatch(updateField({ field: 'equipment_involved', value: info.equipment_involved ?? '' }));
    dispatch(updateField({ field: 'material_impact', value: info.material_impact ?? '' }));
    dispatch(updateField({ field: 'initial_risk_assessment', value: info.initial_risk_assessment ?? '' }));
    dispatch(updateField({ field: 'source_content', value: sourceText }));
    dispatch(updateField({ field: 'source_type', value: activeTab }));
    dispatch(setFiveWhys(result.fiveWhys ?? []));
    dispatch(setFishbone(result.fishbone ?? []));
    dispatch(setRootCauses(result.rootCauses ?? []));
    dispatch(setEvidenceGaps(result.evidenceGaps ?? []));
    dispatch(setCapas(result.capas ?? []));
  }, [result, dispatch, sourceText, activeTab]);

  const handleReset = useCallback(() => {
    dispatch(clearResult());
    setSourceText('');
    setFileName('');
  }, [dispatch]);

  const steps = [
    { key: 'extract', label: 'Extracting deviation info' },
    { key: 'five_whys', label: '5 Whys analysis' },
    { key: 'fishbone', label: 'Fishbone analysis' },
    { key: 'root_causes', label: 'Identifying root causes' },
    { key: 'evidence_gaps', label: 'Finding evidence gaps' },
    { key: 'capa', label: 'Generating CAPA' },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">AI Analysis Assistant</h2>
            <p className="text-xs text-slate-500">Upload or paste incident info for AI-powered extraction</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {result ? (
          <ResultView result={result} onApply={handleApplyResults} onReset={handleReset} />
        ) : (
          <>
            {/* Source tabs */}
            <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1">
              {SOURCE_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Input area */}
            {activeTab === 'pdf' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file && file.type === 'application/pdf') handleFileUpload(file);
                }}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 py-12 hover:border-blue-400 hover:bg-blue-50/50"
              >
                <Upload className="mb-2 h-8 w-8 text-slate-400" />
                <p className="text-sm font-medium text-slate-600">
                  {fileName || 'Click to upload or drag & drop PDF'}
                </p>
                <p className="mt-1 text-xs text-slate-400">PDF files up to 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </div>
            ) : (
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder={
                  activeTab === 'email'
                    ? 'Paste the email content here...\n\nFrom: lab Technician\nSubject: Deviation in Batch API-2026-0147\n\nDuring the HPLC analysis of Batch API-2026-0147, the system suitability test showed %RSD of 3.5%, exceeding the acceptance limit of NMT 2.0%...'
                    : 'Paste the incident report, deviation description, or investigation notes here...\n\nExample:\nOn March 15, 2026, during the crystallization step of API Batch PRD-2026-0342 (Ibuprofen), the temperature in reactor R-105 dropped to 18°C instead of the validated range of 25-30°C. This was discovered during the batch record review...'
                }
                rows={14}
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            )}

            {/* Processing steps */}
            {processing && (
              <div className="mt-4 space-y-2 rounded-lg bg-blue-50 p-4 animate-fade-in">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI workflow in progress...
                </div>
                <div className="space-y-1.5">
                  {steps.map((s) => {
                    const isCurrent = step === s.key;
                    const isPassed = steps.findIndex((x) => x.key === step) > steps.findIndex((x) => x.key === s.key);
                    return (
                      <div
                        key={s.key}
                        className={`flex items-center gap-2 text-xs ${
                          isCurrent ? 'text-blue-700' : isPassed ? 'text-slate-400' : 'text-slate-300'
                        }`}
                      >
                        {isCurrent ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : isPassed ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-slate-300" />
                        )}
                        {s.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 animate-fade-in">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-medium">Analysis failed</p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Action button */}
            <button
              onClick={handleAnalyze}
              disabled={!sourceText.trim() || processing}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze with AI
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ResultView({
  result,
  onApply,
  onReset,
}: {
  result: NonNullable<ReturnType<typeof useAppSelector>['ai']['result']>;
  onApply: () => void;
  onReset: () => void;
}) {
  const info = result.extractedInfo;
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">AI analysis complete</p>
          <p className="text-xs text-emerald-600">Review the extracted information and apply to the form</p>
        </div>
      </div>

      {/* Extracted deviation info */}
      <Section title="Extracted Deviation Info">
        <Field label="Title" value={info.title} />
        <Field label="Product" value={info.product_name} />
        <Field label="Batch" value={info.batch_number} />
        <Field label="Date" value={info.deviation_date} />
        <Field label="Category" value={info.deviation_category} />
        <Field label="Severity" value={info.severity} />
        <Field label="Process Step" value={info.process_step} />
        <Field label="Equipment" value={info.equipment_involved} />
        <Field label="Description" value={info.deviation_description} full />
      </Section>

      {/* 5 Whys summary */}
      {result.fiveWhys.length > 0 && (
        <Section title={`5 Whys (${result.fiveWhys.length} steps)`}>
          {result.fiveWhys.map((w, i) => (
            <div key={i} className={`rounded-md p-2 text-xs ${w.is_root_cause ? 'bg-blue-50' : ''}`}>
              <p className="font-medium text-slate-700">
                {w.is_root_cause && 'Root Cause: '}
                {w.question}
              </p>
              <p className="mt-1 text-slate-600">{w.answer}</p>
            </div>
          ))}
        </Section>
      )}

      {/* Root causes summary */}
      {result.rootCauses.length > 0 && (
        <Section title={`Root Causes (${result.rootCauses.length})`}>
          {result.rootCauses.map((rc, i) => (
            <div key={i} className="rounded-md bg-amber-50 p-2 text-xs">
              <p className="font-medium text-slate-700">{rc.description}</p>
              <p className="mt-0.5 text-slate-500">Confidence: {rc.confidence}</p>
            </div>
          ))}
        </Section>
      )}

      {/* CAPA summary */}
      {result.capas.length > 0 && (
        <Section title={`CAPA Recommendations (${result.capas.length})`}>
          {result.capas.map((c, i) => (
            <div key={i} className="rounded-md p-2 text-xs">
              <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${c.type === 'corrective' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                {c.type}
              </span>
              <p className="mt-1 text-slate-700">{c.description}</p>
            </div>
          ))}
        </Section>
      )}

      {/* Evidence gaps summary */}
      {result.evidenceGaps.length > 0 && (
        <Section title={`Evidence Gaps (${result.evidenceGaps.length})`}>
          {result.evidenceGaps.map((g, i) => (
            <div key={i} className="rounded-md bg-red-50 p-2 text-xs">
              <p className="text-slate-700">{g.description}</p>
              <p className="mt-0.5 text-slate-500">Significance: {g.significance}</p>
            </div>
          ))}
        </Section>
      )}

      <div className="flex gap-2 border-t border-slate-100 pt-4">
        <button
          onClick={onReset}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Start Over
        </button>
        <button
          onClick={onApply}
          className="flex flex-[2] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Apply to Form
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="mb-2 text-xs font-semibold text-slate-700">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Field({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  if (!value) return null;
  return (
    <div className={full ? '' : 'flex justify-between gap-2'}>
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs text-slate-700 ${full ? 'block mt-0.5' : ''}`}>{value}</span>
    </div>
  );
}
