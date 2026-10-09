export type ViolationType = 'garbage' | 'spitting' | 'littering';
export type ViolationStatus = 'pending' | 'paid' | 'disputed' | 'waived';
export type ViolationSource = 'camera' | 'cctv';
export type EscalationLevel = 0 | 1 | 2 | 3;

export interface Citizen {
  id: string;
  full_name: string;
  aadhaar_number: string | null;
  phone: string | null;
  address: string | null;
  face_descriptor: number[];
  photo_url: string | null;
  date_registered: string;
  created_at: string;
}

export interface Violation {
  id: string;
  citizen_id: string | null;
  violation_type: ViolationType;
  location: string | null;
  description: string | null;
  fine_amount: number;
  status: ViolationStatus;
  photo_url: string | null;
  incident_date: string;
  created_at: string;
  suspect_name: string | null;
  suspect_face_descriptor: number[] | null;
  suspect_photo_url: string | null;
  source: ViolationSource;
  due_date: string | null;
  escalation_level: EscalationLevel;
  escalated_at: string | null;
  cctv_camera_name: string | null;
  citizen?: Citizen | null;
}

export interface ViolationWithCitizen extends Violation {
  citizen: Citizen;
}

export const VIOLATION_LABELS: Record<ViolationType, string> = {
  garbage: 'Improper Garbage Disposal',
  spitting: 'Spitting in Public',
  littering: 'Littering in Public Area',
};

export const VIOLATION_DEFAULT_FINES: Record<ViolationType, number> = {
  garbage: 500,
  spitting: 200,
  littering: 300,
};

export const VIOLATION_ICONS: Record<ViolationType, string> = {
  garbage: 'Trash2',
  spitting: 'AlertCircle',
  littering: 'Recycle',
};

export const STATUS_LABELS: Record<ViolationStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  disputed: 'Disputed',
  waived: 'Waived',
};

export const STATUS_COLORS: Record<ViolationStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  disputed: 'bg-red-100 text-red-800 border-red-200',
  waived: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const SOURCE_LABELS: Record<ViolationSource, string> = {
  camera: 'Live Camera',
  cctv: 'CCTV Footage',
};

export const ESCALATION_LABELS: Record<EscalationLevel, string> = {
  0: 'No Action',
  1: 'First Reminder',
  2: 'Formal Notice',
  3: 'Legal Action',
};

export const ESCALATION_DESCRIPTIONS: Record<EscalationLevel, string> = {
  0: 'Fine is within the payment deadline',
  1: 'First reminder sent — fine is overdue',
  2: 'Formal legal notice issued — repeated non-payment',
  3: 'Legal action initiated — court proceedings',
};

export const ESCALATION_COLORS: Record<EscalationLevel, string> = {
  0: 'bg-slate-100 text-slate-600 border-slate-200',
  1: 'bg-amber-100 text-amber-800 border-amber-200',
  2: 'bg-orange-100 text-orange-800 border-orange-200',
  3: 'bg-red-100 text-red-800 border-red-200',
};

export const DEFAULT_PAYMENT_DAYS = 15;

export function isOverdue(violation: Violation): boolean {
  if (violation.status !== 'pending') return false;
  if (!violation.due_date) return false;
  return new Date(violation.due_date).getTime() < Date.now();
}

export function getDaysOverdue(violation: Violation): number {
  if (!isOverdue(violation) || !violation.due_date) return 0;
  const diff = Date.now() - new Date(violation.due_date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getDaysUntilDue(violation: Violation): number {
  if (!violation.due_date) return -1;
  const diff = new Date(violation.due_date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getDueDateLabel(violation: Violation): string {
  if (!violation.due_date) return 'No deadline';
  const days = getDaysUntilDue(violation);
  if (days < 0) {
    const overdue = Math.abs(days);
    return `${overdue} day${overdue !== 1 ? 's' : ''} overdue`;
  }
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `${days} days remaining`;
}
