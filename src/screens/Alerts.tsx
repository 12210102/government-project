import { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle,
  Clock,
  Gavel,
  Send,
  TrendingUp,
  ChevronRight,
  Phone,
  MapPin,
  UserX,
  Bell,
  CalendarClock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button, Spinner, EmptyState } from '@/components/ui';
import {
  VIOLATION_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  ESCALATION_LABELS,
  ESCALATION_DESCRIPTIONS,
  ESCALATION_COLORS,
  isOverdue,
  getDaysOverdue,
  getDaysUntilDue,
  getDueDateLabel,
  type Violation,
  type Citizen,
  type EscalationLevel,
} from '@/types';
import { getRecommendedEscalation } from '@/utils/escalation';

interface ViolationRow extends Violation {
  citizen: Citizen | null;
}

export function Alerts() {
  const [violations, setViolations] = useState<ViolationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [escalating, setEscalating] = useState<string | null>(null);

  const fetchViolations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('violations')
      .select('*, citizen:citizens(*)')
      .eq('status', 'pending')
      .order('due_date', { ascending: true, nullsFirst: false });
    if (error) console.error('Failed to load alerts:', error);
    setViolations((data || []) as ViolationRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchViolations(); }, [fetchViolations]);

  const overdue = violations.filter((v) => isOverdue(v));
  const dueSoon = violations.filter((v) => {
    if (isOverdue(v) || !v.due_date) return false;
    const days = getDaysUntilDue(v);
    return days >= 0 && days <= 3;
  });
  const onTrack = violations.filter((v) => !isOverdue(v) && !(dueSoon.includes(v)));

  const escalate = async (id: string, level: EscalationLevel) => {
    setEscalating(id);
    const { error } = await supabase
      .from('violations')
      .update({
        escalation_level: level,
        escalated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (!error) {
      setViolations((prev) =>
        prev.map((v) => v.id === id ? { ...v, escalation_level: level, escalated_at: new Date().toISOString() } : v)
      );
    }
    setEscalating(null);
  };

  const getDisplayName = (v: ViolationRow) =>
    v.citizen?.full_name || v.suspect_name || 'Unidentified';

  const getDisplayPhoto = (v: ViolationRow) =>
    v.citizen?.photo_url || v.suspect_photo_url || null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const summaryStats = [
    { label: 'Overdue', value: overdue.length, icon: <AlertTriangle className="h-5 w-5" />, color: 'bg-red-50 text-red-600' },
    { label: 'Due Soon (3 days)', value: dueSoon.length, icon: <Clock className="h-5 w-5" />, color: 'bg-amber-50 text-amber-600' },
    { label: 'Escalated', value: violations.filter((v) => v.escalation_level > 0).length, icon: <TrendingUp className="h-5 w-5" />, color: 'bg-orange-50 text-orange-600' },
    { label: 'Legal Action', value: violations.filter((v) => v.escalation_level === 3).length, icon: <Gavel className="h-5 w-5" />, color: 'bg-red-50 text-red-600' },
  ];

  const renderViolationCard = (v: ViolationRow, showEscalation: boolean) => {
    const recommended = getRecommendedEscalation(v);
    const daysLate = getDaysOverdue(v);
    return (
      <Card key={v.id} className={`p-4 ${isOverdue(v) ? 'border-red-200' : 'border-amber-200'}`}>
        <div className="flex items-start gap-3">
          {getDisplayPhoto(v) ? (
            <img src={getDisplayPhoto(v) || ''} alt={getDisplayName(v)} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-lg font-semibold text-slate-400 flex-shrink-0">
              {getDisplayName(v).charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-900">{getDisplayName(v)}</p>
              {!v.citizen_id && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                  <UserX className="h-3 w-3 mr-0.5" /> Unidentified
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{VIOLATION_LABELS[v.violation_type]}</p>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="flex items-center gap-1 text-slate-600">
                <CalendarClock className="h-3.5 w-3.5" /> {formatDate(v.incident_date)}
              </span>
              <span className={`flex items-center gap-1 font-medium ${isOverdue(v) ? 'text-red-600' : 'text-amber-600'}`}>
                {getDueDateLabel(v)}
              </span>
            </div>
            {v.citizen?.phone && (
              <p className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                <Phone className="h-3 w-3" /> {v.citizen.phone}
              </p>
            )}
            {v.location && (
              <p className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                <MapPin className="h-3 w-3" /> {v.location}
              </p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-slate-900">₹{Number(v.fine_amount).toLocaleString('en-IN')}</p>
            <Badge className={`mt-1 ${ESCALATION_COLORS[v.escalation_level]}`}>
              {ESCALATION_LABELS[v.escalation_level]}
            </Badge>
          </div>
        </div>

        {showEscalation && isOverdue(v) && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-600">
                {daysLate} day{daysLate !== 1 ? 's' : ''} overdue
                {recommended > v.escalation_level && (
                  <span className="ml-2 text-red-600">
                    — Recommended: {ESCALATION_LABELS[recommended]}
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {([1, 2, 3] as EscalationLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => escalate(v.id, level)}
                  disabled={escalating === v.id}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                    v.escalation_level === level
                      ? ESCALATION_COLORS[level]
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {level === 1 && <Send className="h-3 w-3" />}
                  {level === 2 && <AlertTriangle className="h-3 w-3" />}
                  {level === 3 && <Gavel className="h-3 w-3" />}
                  {ESCALATION_LABELS[level]}
                </button>
              ))}
            </div>
            {v.escalated_at && (
              <p className="mt-2 text-xs text-slate-400">
                Last escalated: {formatDate(v.escalated_at)}
              </p>
            )}
          </div>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fine Alerts & Escalation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overdue fines and escalation actions for non-payment
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryStats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Overdue Section */}
      {overdue.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Overdue Fines ({overdue.length})
            </h2>
          </div>
          <div className="space-y-3">
            {overdue.map((v) => renderViolationCard(v, true))}
          </div>
        </div>
      )}

      {/* Due Soon Section */}
      {dueSoon.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Due Soon ({dueSoon.length})
            </h2>
          </div>
          <div className="space-y-3">
            {dueSoon.map((v) => renderViolationCard(v, false))}
          </div>
        </div>
      )}

      {/* On Track */}
      {onTrack.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-5 w-5 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900">
              On Track ({onTrack.length})
            </h2>
          </div>
          <div className="space-y-3">
            {onTrack.map((v) => renderViolationCard(v, false))}
          </div>
        </div>
      )}

      {/* Empty */}
      {violations.length === 0 && (
        <Card>
          <EmptyState
            icon={<Bell className="h-12 w-12" />}
            title="No pending fines"
            description="All fines have been resolved"
          />
        </Card>
      )}
    </div>
  );
}
