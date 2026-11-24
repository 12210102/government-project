export type Severity = 'Minor' | 'Major' | 'Critical';
export type DeviationCategory =
  | 'Process'
  | 'Equipment'
  | 'Analytical'
  | 'Documentation'
  | 'Environmental'
  | 'Material'
  | 'Utility'
  | 'Other';
export type InvestigationStatus = 'draft' | 'in_progress' | 'under_review' | 'closed';
export type SourceType = 'pdf' | 'text' | 'email';
export type InvestigationMethod = '5 Whys' | 'Fishbone';
export type Confidence = 'High' | 'Medium' | 'Low';
export type CapaType = 'corrective' | 'preventive';
export type CapaStatus = 'proposed' | 'approved' | 'in_progress' | 'completed';
export type GapSignificance = 'High' | 'Medium' | 'Low';
export type GapStatus = 'open' | 'resolved';

export interface FiveWhy {
  id?: string;
  investigation_id?: string;
  step_number: number;
  question: string;
  answer: string;
  is_root_cause: boolean;
}

export interface FishboneCause {
  cause: string;
  evidence: string;
}

export interface FishboneCategory {
  id?: string;
  investigation_id?: string;
  category: string;
  causes: FishboneCause[];
}

export interface RootCause {
  id?: string;
  investigation_id?: string;
  description: string;
  category: string;
  contributing_factors: string[];
  confidence: Confidence;
  evidence_summary: string;
  confirmed: boolean;
}

export interface EvidenceGap {
  id?: string;
  investigation_id?: string;
  description: string;
  significance: GapSignificance;
  status: GapStatus;
}

export interface Capa {
  id?: string;
  investigation_id?: string;
  type: CapaType;
  description: string;
  rationale: string;
  owner: string;
  target_date: string | null;
  status: CapaStatus;
}

export interface Investigation {
  id: string;
  title: string;
  deviation_number: string | null;
  product_name: string;
  batch_number: string;
  deviation_date: string | null;
  deviation_description: string;
  deviation_category: string;
  severity: Severity;
  process_step: string;
  equipment_involved: string;
  material_impact: string;
  initial_risk_assessment: string;
  investigation_method: InvestigationMethod;
  status: InvestigationStatus;
  source_type: SourceType;
  source_content: string;
  created_at: string;
  updated_at: string;
}

export interface InvestigationDetail extends Investigation {
  five_whys: FiveWhy[];
  fishbone: FishboneCategory[];
  root_causes: RootCause[];
  evidence_gaps: EvidenceGap[];
  capas: Capa[];
}

export interface AIAnalysisResult {
  extractedInfo: {
    title?: string;
    product_name?: string;
    batch_number?: string;
    deviation_date?: string | null;
    deviation_description?: string;
    deviation_category?: string;
    severity?: string;
    process_step?: string;
    equipment_involved?: string;
    material_impact?: string;
    initial_risk_assessment?: string;
  };
  fiveWhys: FiveWhy[];
  fishbone: FishboneCategory[];
  rootCauses: RootCause[];
  evidenceGaps: EvidenceGap[];
  capas: Capa[];
}

export const DEVIATION_CATEGORIES: DeviationCategory[] = [
  'Process',
  'Equipment',
  'Analytical',
  'Documentation',
  'Environmental',
  'Material',
  'Utility',
  'Other',
];

export const SEVERITIES: Severity[] = ['Minor', 'Major', 'Critical'];

export const INVESTIGATION_STATUSES: InvestigationStatus[] = ['draft', 'in_progress', 'under_review', 'closed'];

export const STATUS_LABELS: Record<InvestigationStatus, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  under_review: 'Under Review',
  closed: 'Closed',
};

export const STATUS_COLORS: Record<InvestigationStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  under_review: 'bg-amber-100 text-amber-700 border-amber-200',
  closed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  Minor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Major: 'bg-amber-100 text-amber-700 border-amber-200',
  Critical: 'bg-red-100 text-red-700 border-red-200',
};

export const CONFIDENCE_COLORS: Record<Confidence, string> = {
  High: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low: 'bg-red-100 text-red-700 border-red-200',
};

export const FISHBONE_CATEGORIES = [
  'Methods',
  'Machines',
  'Materials',
  'Manpower',
  'Measurement',
  'Environment',
] as const;

export const CAPA_TYPE_LABELS: Record<CapaType, string> = {
  corrective: 'Corrective Action',
  preventive: 'Preventive Action',
};

export const CAPA_TYPE_COLORS: Record<CapaType, string> = {
  corrective: 'bg-blue-100 text-blue-700 border-blue-200',
  preventive: 'bg-teal-100 text-teal-700 border-teal-200',
};

export const CAPA_STATUS_LABELS: Record<CapaStatus, string> = {
  proposed: 'Proposed',
  approved: 'Approved',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export const CAPA_STATUS_COLORS: Record<CapaStatus, string> = {
  proposed: 'bg-slate-100 text-slate-700 border-slate-200',
  approved: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export const GAP_SIGNIFICANCE_COLORS: Record<GapSignificance, string> = {
  High: 'bg-red-100 text-red-700 border-red-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low: 'bg-slate-100 text-slate-700 border-slate-200',
};
