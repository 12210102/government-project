import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Users,
  ChevronRight,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button, Input, EmptyState, Spinner } from '@/components/ui';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  VIOLATION_LABELS,
  type Citizen,
  type Violation,
  type ViolationStatus,
} from '@/types';
import type { Page } from '@/App';

export function Citizens({ onNavigate }: { onNavigate: (page: Page, data?: unknown) => void }) {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCitizen, setSelectedCitizen] = useState<{
    citizen: Citizen;
    violations: Violation[];
  } | null>(null);

  const fetchCitizens = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('citizens')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load citizens:', error);
    }
    setCitizens((data || []) as Citizen[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCitizens();
  }, [fetchCitizens]);

  const viewCitizenDetails = async (citizen: Citizen) => {
    const { data: violations } = await supabase
      .from('violations')
      .select('*')
      .eq('citizen_id', citizen.id)
      .order('created_at', { ascending: false });
    setSelectedCitizen({ citizen, violations: (violations || []) as Violation[] });
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filtered = citizens.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      c.aadhaar_number?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  const totalFines = (violations: Violation[]) =>
    violations.reduce((sum, v) => sum + Number(v.fine_amount), 0);
  const pendingCount = (violations: Violation[]) =>
    violations.filter((v) => v.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Citizen Registry</h1>
          <p className="mt-1 text-sm text-slate-500">
            All registered persons in the database
          </p>
        </div>
        <Button onClick={() => onNavigate('register')}>
          <Users className="h-4 w-4" /> Register New
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, Aadhaar, or phone..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </Card>

      {/* List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="No citizens registered"
            description="Register a person to get started"
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer"
                onClick={() => viewCitizenDetails(c)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {c.photo_url ? (
                    <img
                      src={c.photo_url}
                      alt={c.full_name}
                      className="h-11 w-11 rounded-full object-cover border border-slate-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-400 flex-shrink-0">
                      {c.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {c.full_name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      Registered {formatDate(c.created_at)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {selectedCitizen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedCitizen(null)}
        >
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {selectedCitizen.citizen.photo_url ? (
                    <img
                      src={selectedCitizen.citizen.photo_url}
                      alt={selectedCitizen.citizen.full_name}
                      className="h-16 w-16 rounded-lg object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-xl font-semibold text-slate-400">
                      {selectedCitizen.citizen.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {selectedCitizen.citizen.full_name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Registered {formatDate(selectedCitizen.citizen.created_at)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCitizen(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <ChevronRight className="h-5 w-5 rotate-90" />
                </button>
              </div>

              {/* Contact info */}
              <div className="mt-6 space-y-2 text-sm">
                {selectedCitizen.citizen.aadhaar_number && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <FileText className="h-4 w-4 text-slate-400" />
                    Aadhaar: {selectedCitizen.citizen.aadhaar_number}
                  </div>
                )}
                {selectedCitizen.citizen.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {selectedCitizen.citizen.phone}
                  </div>
                )}
                {selectedCitizen.citizen.address && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {selectedCitizen.citizen.address}
                  </div>
                )}
              </div>

              {/* Summary stats */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Total Fines</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {selectedCitizen.violations.length}
                  </p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-center">
                  <p className="text-xs text-amber-600">Pending</p>
                  <p className="mt-1 text-lg font-bold text-amber-700">
                    {pendingCount(selectedCitizen.violations)}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-center">
                  <p className="text-xs text-blue-600">Total Amount</p>
                  <p className="mt-1 text-lg font-bold text-blue-700">
                    ₹{totalFines(selectedCitizen.violations).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Violations list */}
              <div className="mt-6">
                <p className="text-sm font-medium text-slate-700 mb-2">Violation History</p>
                {selectedCitizen.violations.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">
                    No violations recorded
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedCitizen.violations.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {VIOLATION_LABELS[v.violation_type]}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(v.incident_date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            ₹{Number(v.fine_amount).toLocaleString('en-IN')}
                          </span>
                          <Badge className={STATUS_COLORS[v.status as ViolationStatus]}>
                            {STATUS_LABELS[v.status as ViolationStatus]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => onNavigate('issue-fine', { citizen: selectedCitizen.citizen })}>
                  <FileText className="h-4 w-4" /> Issue New Fine
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
