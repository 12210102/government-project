import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchInvestigations } from '@/store/investigationSlice';
import {
  FileSearch,
  Plus,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Badge, Button, LoadingSpinner, EmptyState } from '@/components/ui';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  SEVERITY_COLORS,
  type Investigation,
} from '@/types';

interface DashboardProps {
  onNew: () => void;
  onOpen: (id: string) => void;
}

export function Dashboard({ onNew, onOpen }: DashboardProps) {
  const dispatch = useAppDispatch();
  const { list, loading } = useAppSelector((s) => s.investigation);

  useEffect(() => {
    dispatch(fetchInvestigations());
  }, [dispatch]);

  const stats = useMemo(() => {
    const total = list.length;
    const open = list.filter((i) => i.status === 'in_progress' || i.status === 'draft').length;
    const review = list.filter((i) => i.status === 'under_review').length;
    const closed = list.filter((i) => i.status === 'closed').length;
    const critical = list.filter((i) => i.severity === 'Critical').length;
    return { total, open, review, closed, critical };
  }, [list]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">RCA Investigations</h1>
          <p className="mt-1 text-sm text-slate-500">
            AI-powered Root Cause Analysis for pharmaceutical API manufacturing
          </p>
        </div>
        <Button onClick={onNew} size="lg">
          <Plus className="h-4 w-4" />
          New Investigation
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<FileSearch className="h-5 w-5" />}
          label="Total Investigations"
          value={stats.total}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="In Progress"
          value={stats.open}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Critical Severity"
          value={stats.critical}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Closed"
          value={stats.closed}
          color="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Investigations list */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Recent Investigations</h3>
        </div>

        {loading && list.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner label="Loading investigations..." />
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<FlaskConical className="h-6 w-6" />}
            title="No investigations yet"
            description="Start your first AI-powered Root Cause Analysis by uploading an incident report, pasting text, or forwarding an email."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {list.map((inv) => (
              <InvestigationRow key={inv.id} investigation={inv} onOpen={() => onOpen(inv.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>{icon}</div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function InvestigationRow({ investigation, onOpen }: { investigation: Investigation; onOpen: () => void }) {
  const dateStr = investigation.deviation_date
    ? new Date(investigation.deviation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No date';

  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <FlaskConical className="h-5 w-5 text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">
            {investigation.title || 'Untitled investigation'}
          </p>
          {investigation.deviation_number && (
            <span className="flex-shrink-0 text-xs text-slate-400">{investigation.deviation_number}</span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
          <span>{investigation.product_name || 'Unknown product'}</span>
          {investigation.batch_number && <span>Batch: {investigation.batch_number}</span>}
          <span>{dateStr}</span>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        {investigation.deviation_category && (
          <Badge className="bg-slate-100 text-slate-600 border-slate-200">
            {investigation.deviation_category}
          </Badge>
        )}
        <Badge className={SEVERITY_COLORS[investigation.severity]}>
          {investigation.severity}
        </Badge>
        <Badge className={STATUS_COLORS[investigation.status]}>
          {STATUS_LABELS[investigation.status]}
        </Badge>
        <ChevronRight className="h-4 w-4 text-slate-300" />
      </div>
    </button>
  );
}
