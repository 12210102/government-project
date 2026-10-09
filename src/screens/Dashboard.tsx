import {
  Users,
  FileText,
  TrendingUp,
  Trash2,
  AlertCircle,
  Recycle,
  Clock,
  CheckCircle2,
  UserX,
  Cctv,
  Bell,
  AlertTriangle,
  Gavel,
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Card, Badge, Spinner } from '@/components/ui';
import {
  VIOLATION_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  isOverdue,
  getDueDateLabel,
  type ViolationType,
} from '@/types';
import type { Page } from '@/App';

export function Dashboard({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const stats = useDashboardStats();

  const statCards = [
    { label: 'Registered Citizens', value: stats.totalCitizens, icon: <Users className="h-5 w-5" />, color: 'bg-blue-50 text-blue-600', onClick: () => onNavigate('citizens') },
    { label: 'Total Violations', value: stats.totalViolations, icon: <FileText className="h-5 w-5" />, color: 'bg-orange-50 text-orange-600', onClick: () => onNavigate('violations') },
    { label: 'Pending Fines', value: `₹${stats.pendingFines.toLocaleString('en-IN')}`, icon: <Clock className="h-5 w-5" />, color: 'bg-amber-50 text-amber-600', onClick: () => onNavigate('violations') },
    { label: 'Collected Fines', value: `₹${stats.collectedFines.toLocaleString('en-IN')}`, icon: <CheckCircle2 className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-600', onClick: () => onNavigate('violations') },
  ];

  const violationBreakdown = [
    { type: 'garbage' as ViolationType, count: stats.garbageCount, icon: <Trash2 className="h-4 w-4" />, color: 'text-orange-600 bg-orange-50' },
    { type: 'spitting' as ViolationType, count: stats.spittingCount, icon: <AlertCircle className="h-4 w-4" />, color: 'text-red-600 bg-red-50' },
    { type: 'littering' as ViolationType, count: stats.litteringCount, icon: <Recycle className="h-4 w-4" />, color: 'text-teal-600 bg-teal-50' },
  ];

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const getDisplayName = (v: { citizen?: { full_name: string } | null; suspect_name?: string | null }) =>
    v.citizen?.full_name || v.suspect_name || 'Unidentified';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Overview of enforcement activity and statistics</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label} className="cursor-pointer p-5 transition-shadow hover:shadow-md">
            <button onClick={card.onClick} className="flex w-full items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
              </div>
              <div className={`rounded-lg p-2.5 ${card.color}`}>{card.icon}</div>
            </button>
          </Card>
        ))}
      </div>

      {/* Overdue Alert */}
      {stats.overdueCount > 0 && (
        <Card className="border-red-200 bg-red-50/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">
                {stats.overdueCount} overdue fine{stats.overdueCount !== 1 ? 's' : ''} — ₹{stats.overdueAmount.toLocaleString('en-IN')} unpaid past deadline
              </p>
              <p className="text-xs text-red-700">
                {stats.escalatedCount > 0 && `${stats.escalatedCount} have been escalated · `}
                Take action before legal proceedings are required
              </p>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              View Alerts
            </button>
          </div>
        </Card>
      )}

      {/* Unidentified alert */}
      {stats.unidentifiedCount > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-600">
              <UserX className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                {stats.unidentifiedCount} violation{stats.unidentifiedCount !== 1 ? 's' : ''} issued to unidentified persons
              </p>
              <p className="text-xs text-amber-700">
                These will be automatically linked when the person is registered in the system
              </p>
            </div>
            <button
              onClick={() => onNavigate('register')}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
            >
              Register Person
            </button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Violation Breakdown */}
        <Card className="p-5 lg:col-span-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900">Violation Breakdown</h2>
          </div>
          <div className="mt-4 space-y-3">
            {violationBreakdown.map((item) => {
              const pct = stats.totalViolations > 0 ? Math.round((item.count / stats.totalViolations) * 100) : 0;
              return (
                <div key={item.type}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md p-1.5 ${item.color}`}>{item.icon}</span>
                      <span className="text-sm text-slate-700">{VIOLATION_LABELS[item.type]}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{item.count}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Escalation summary */}
          {stats.escalatedCount > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 text-sm">
                <Gavel className="h-4 w-4 text-orange-500" />
                <span className="text-slate-600">
                  <span className="font-semibold text-slate-900">{stats.escalatedCount}</span> escalated fine{stats.escalatedCount !== 1 ? 's' : ''}
                </span>
                <button onClick={() => onNavigate('alerts')} className="ml-auto text-xs text-blue-600 hover:text-blue-700">
                  View
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Recent Violations */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent Violations</h2>
            {stats.overdueCount > 0 && (
              <button onClick={() => onNavigate('alerts')} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700">
                <Bell className="h-3.5 w-3.5" /> {stats.overdueCount} overdue
              </button>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {stats.recentViolations.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No violations recorded yet</p>
            ) : (
              stats.recentViolations.map((v) => {
                const overdue = isOverdue(v);
                return (
                  <div key={v.id} className={`flex items-center justify-between rounded-lg border p-3 ${overdue ? 'border-red-200 bg-red-50/30' : 'border-slate-100'} hover:bg-slate-50`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {getDisplayName(v).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">{getDisplayName(v)}</p>
                          {!v.citizen_id && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                              <UserX className="h-3 w-3 mr-0.5" /> Unidentified
                            </Badge>
                          )}
                          {overdue && (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              <AlertTriangle className="h-3 w-3 mr-0.5" /> Overdue
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          {v.source === 'cctv' && <Cctv className="h-3 w-3" />}
                          {VIOLATION_LABELS[v.violation_type]}
                          {v.due_date && <span className="ml-1">· {getDueDateLabel(v)}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900">₹{Number(v.fine_amount).toLocaleString('en-IN')}</span>
                      <Badge className={STATUS_COLORS[v.status]}>{STATUS_LABELS[v.status]}</Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
