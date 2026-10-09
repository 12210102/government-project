import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Trash2,
  AlertCircle,
  Recycle,
  Filter,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  AlertTriangle,
  Gavel,
  UserX,
  Cctv,
  Camera,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button, Select, EmptyState, Spinner } from '@/components/ui';
import {
  VIOLATION_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  SOURCE_LABELS,
  ESCALATION_LABELS,
  ESCALATION_COLORS,
  isOverdue,
  getDueDateLabel,
  getDaysOverdue,
  type Violation,
  type ViolationType,
  type ViolationStatus,
  type ViolationSource,
  type Citizen,
} from '@/types';

const VIOLATION_ICONS_MAP: Record<ViolationType, React.ReactNode> = {
  garbage: <Trash2 className="h-4 w-4" />,
  spitting: <AlertCircle className="h-4 w-4" />,
  littering: <Recycle className="h-4 w-4" />,
};

const STATUS_ICONS: Record<ViolationStatus, React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5" />,
  paid: <CheckCircle2 className="h-3.5 w-3.5" />,
  disputed: <XCircle className="h-3.5 w-3.5" />,
  waived: <Ban className="h-3.5 w-3.5" />,
};

interface ViolationRow extends Violation {
  citizen: Citizen | null;
}

export function Violations() {
  const [violations, setViolations] = useState<ViolationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ViolationStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ViolationType | 'all'>('all');
  const [selectedViolation, setSelectedViolation] = useState<ViolationRow | null>(null);

  const fetchViolations = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('violations')
      .select('*, citizen:citizens(*)')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (typeFilter !== 'all') query = query.eq('violation_type', typeFilter);

    const { data, error } = await query;
    if (error) console.error('Failed to load violations:', error);
    setViolations((data || []) as ViolationRow[]);
    setLoading(false);
  }, [statusFilter, typeFilter]);

  useEffect(() => { fetchViolations(); }, [fetchViolations]);

  const filtered = violations.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.citizen?.full_name?.toLowerCase().includes(q) ||
      v.suspect_name?.toLowerCase().includes(q) ||
      v.location?.toLowerCase().includes(q) ||
      VIOLATION_LABELS[v.violation_type].toLowerCase().includes(q)
    );
  });

  const updateStatus = async (id: string, status: ViolationStatus) => {
    const { error } = await supabase.from('violations').update({ status }).eq('id', id);
    if (!error) {
      setViolations((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));
      setSelectedViolation((prev) => prev && prev.id === id ? { ...prev, status } : prev);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  const getDisplayName = (v: ViolationRow) =>
    v.citizen?.full_name || v.suspect_name || 'Unidentified';

  const getDisplayPhoto = (v: ViolationRow) =>
    v.citizen?.photo_url || v.suspect_photo_url || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Violation Records</h1>
        <p className="mt-1 text-sm text-slate-500">All issued fines and their current status</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, location, or violation type..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ViolationStatus | 'all')} className="w-auto">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="disputed">Disputed</option>
              <option value="waived">Waived</option>
            </Select>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ViolationType | 'all')} className="w-auto">
              <option value="all">All Types</option>
              <option value="garbage">Garbage</option>
              <option value="spitting">Spitting</option>
              <option value="littering">Littering</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Filter className="h-12 w-12" />} title="No violations found" description="Try adjusting your filters or search terms" />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedViolation(v)}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 flex-shrink-0">
                    {VIOLATION_ICONS_MAP[v.violation_type]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 truncate">{getDisplayName(v)}</p>
                      {!v.citizen_id && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex-shrink-0">
                          <UserX className="h-3 w-3 mr-0.5" /> Unidentified
                        </Badge>
                      )}
                      {isOverdue(v) && (
                        <Badge className="bg-red-100 text-red-800 border-red-200 flex-shrink-0">
                          <AlertTriangle className="h-3 w-3 mr-0.5" /> {getDaysOverdue(v)}d overdue
                        </Badge>
                      )}
                      {v.escalation_level > 0 && (
                        <Badge className={ESCALATION_COLORS[v.escalation_level] + ' flex-shrink-0'}>
                          <Gavel className="h-3 w-3 mr-0.5" /> {ESCALATION_LABELS[v.escalation_level]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {VIOLATION_LABELS[v.violation_type]}
                      {v.location && ` · ${v.location}`}
                      {v.due_date && ` · ${getDueDateLabel(v)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
                    {v.source === 'cctv' ? <Cctv className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
                    {SOURCE_LABELS[v.source as ViolationSource]}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">₹{Number(v.fine_amount).toLocaleString('en-IN')}</span>
                  <Badge className={STATUS_COLORS[v.status]}>{STATUS_LABELS[v.status]}</Badge>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {selectedViolation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedViolation(null)}>
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    {VIOLATION_ICONS_MAP[selectedViolation.violation_type]}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{VIOLATION_LABELS[selectedViolation.violation_type]}</h2>
                    <p className="text-xs text-slate-500">{formatDate(selectedViolation.incident_date)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedViolation(null)} className="text-slate-400 hover:text-slate-600">
                  <ChevronRight className="h-5 w-5 rotate-90" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {/* Person Info */}
                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                  {getDisplayPhoto(selectedViolation) ? (
                    <img src={getDisplayPhoto(selectedViolation) || ''} alt={getDisplayName(selectedViolation)} className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200 text-lg font-semibold text-slate-400">?</div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{getDisplayName(selectedViolation)}</p>
                      {!selectedViolation.citizen_id && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                          <UserX className="h-3 w-3 mr-0.5" /> Unidentified
                        </Badge>
                      )}
                    </div>
                    {selectedViolation.citizen?.phone && <p className="text-xs text-slate-500">{selectedViolation.citizen.phone}</p>}
                    {!selectedViolation.citizen_id && (
                      <p className="text-xs text-amber-600">Will auto-link when this person is registered</p>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Fine Amount</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">₹{Number(selectedViolation.fine_amount).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Status</p>
                    <div className="mt-1">
                      <Badge className={STATUS_COLORS[selectedViolation.status]}>
                        {STATUS_ICONS[selectedViolation.status]}
                        <span className="ml-1">{STATUS_LABELS[selectedViolation.status]}</span>
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500">Source</p>
                    <p className="mt-1 text-slate-900 flex items-center gap-1">
                      {selectedViolation.source === 'cctv' ? <Cctv className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
                      {SOURCE_LABELS[selectedViolation.source as ViolationSource]}
                    </p>
                  </div>
                  {selectedViolation.location && (
                    <div className="col-span-2">
                      <p className="text-slate-500">Location</p>
                      <p className="mt-1 text-slate-900">{selectedViolation.location}</p>
                    </div>
                  )}
                  {selectedViolation.description && (
                    <div className="col-span-2">
                      <p className="text-slate-500">Description</p>
                      <p className="mt-1 text-slate-900">{selectedViolation.description}</p>
                    </div>
                  )}
                </div>

                {/* Status Update */}
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {(['pending', 'paid', 'disputed', 'waived'] as ViolationStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(selectedViolation.id, s)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          selectedViolation.status === s ? STATUS_COLORS[s] : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {STATUS_ICONS[s]}{STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
