import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  startNewInvestigation,
  saveInvestigation,
  clearCurrent,
} from '@/store/investigationSlice';
import { clearResult } from '@/store/aiSlice';
import { AIPanel } from '@/components/AIPanel';
import { DeviationForm } from '@/components/DeviationForm';
import { FiveWhysEditor } from '@/components/FiveWhysEditor';
import { FishboneEditor } from '@/components/FishboneEditor';
import { RootCausesEditor } from '@/components/RootCausesEditor';
import { EvidenceGapsEditor } from '@/components/EvidenceGapsEditor';
import { CapaEditor } from '@/components/CapaEditor';
import { Button, LoadingSpinner } from '@/components/ui';
import {
  FileText,
  Save,
  ArrowLeft,
  ListChecks,
  Target,
  Fish,
  AlertCircle,
  Wrench,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

interface NewInvestigationProps {
  onBack: () => void;
  onSaved: (id: string) => void;
}

const TABS = [
  { id: 'deviation', label: 'Deviation Info', icon: FileText },
  { id: 'five-whys', label: '5 Whys', icon: ListChecks },
  { id: 'fishbone', label: 'Fishbone', icon: Fish },
  { id: 'root-causes', label: 'Root Causes', icon: Target },
  { id: 'evidence-gaps', label: 'Evidence Gaps', icon: AlertCircle },
  { id: 'capa', label: 'CAPA', icon: Wrench },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function NewInvestigation({ onBack, onSaved }: NewInvestigationProps) {
  const dispatch = useAppDispatch();
  const { current, saving, error } = useAppSelector((s) => s.investigation);
  const [activeTab, setActiveTab] = useState<TabId>('deviation');

  useEffect(() => {
    dispatch(startNewInvestigation());
    dispatch(clearResult());
    return () => {
      dispatch(clearCurrent());
    };
  }, [dispatch]);

  const handleSave = useCallback(async () => {
    if (!current) return;
    const result = await dispatch(saveInvestigation(current));
    if (saveInvestigation.fulfilled.match(result) && result.payload.id) {
      onSaved(result.payload.id);
    }
  }, [current, dispatch, onSaved]);

  if (!current) return null;

  const counts = {
    deviation: 0,
    'five-whys': current.five_whys.length,
    fishbone: current.fishbone.length,
    'root-causes': current.root_causes.length,
    'evidence-gaps': current.evidence_gaps.length,
    capa: current.capas.length,
  };

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900">New RCA Investigation</h1>
            <p className="text-xs text-slate-500">Use the AI panel to extract and analyze, then review and edit</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-500">{error}</span>}
          {saving && <LoadingSpinner label="Saving..." />}
          <Button onClick={handleSave} disabled={saving || !current.title}>
            <Save className="h-4 w-4" />
            Save Investigation
          </Button>
        </div>
      </div>

      {/* Split layout: AI panel + form */}
      <div className="flex min-h-0 flex-1">
        {/* AI Panel - left */}
        <div className="hidden w-80 flex-shrink-0 border-r border-slate-200 bg-white lg:block xl:w-96">
          <AIPanel />
        </div>

        {/* Form - right */}
        <div className="flex min-w-0 flex-1 flex-col bg-slate-50">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white px-5 py-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const count = counts[tab.id];
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {count > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === tab.id ? 'bg-blue-200 text-blue-800' : 'bg-slate-200 text-slate-600'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile AI panel toggle */}
          <div className="border-b border-slate-200 bg-white px-5 py-2 lg:hidden">
            <details>
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-blue-600">
                <ChevronDown className="h-4 w-4" />
                AI Analysis Assistant
              </summary>
              <div className="mt-2 h-[500px] overflow-hidden rounded-lg border border-slate-200">
                <AIPanel />
              </div>
            </details>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="mx-auto max-w-3xl">
              {activeTab === 'deviation' && (
                <FormSection title="Deviation Information" subtitle="Record the basic details of the quality deviation">
                  <DeviationForm />
                </FormSection>
              )}
              {activeTab === 'five-whys' && (
                <FormSection title="5 Whys Analysis" subtitle="Sequential questioning to drill down to the root cause">
                  <FiveWhysEditor />
                </FormSection>
              )}
              {activeTab === 'fishbone' && (
                <FormSection title="Fishbone (Ishikawa) Analysis" subtitle="Categorize potential causes across 6 dimensions">
                  <FishboneEditor />
                </FormSection>
              )}
              {activeTab === 'root-causes' && (
                <FormSection title="Root Causes" subtitle="Identified root causes with evidence and confidence levels">
                  <RootCausesEditor />
                </FormSection>
              )}
              {activeTab === 'evidence-gaps' && (
                <FormSection title="Evidence Gaps" subtitle="Missing information needed to complete the investigation">
                  <EvidenceGapsEditor />
                </FormSection>
              )}
              {activeTab === 'capa' && (
                <FormSection title="Corrective & Preventive Actions (CAPA)" subtitle="Actions to correct the issue and prevent recurrence">
                  <CapaEditor />
                </FormSection>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSection({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">{children}</div>
    </div>
  );
}
