import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Citizen, Violation } from '@/types';
import { isOverdue } from '@/types';

interface DashboardStats {
  totalCitizens: number;
  totalViolations: number;
  pendingFines: number;
  collectedFines: number;
  garbageCount: number;
  spittingCount: number;
  litteringCount: number;
  unidentifiedCount: number;
  overdueCount: number;
  overdueAmount: number;
  escalatedCount: number;
  recentViolations: (Violation & { citizen: Citizen | null })[];
  loading: boolean;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCitizens: 0,
    totalViolations: 0,
    pendingFines: 0,
    collectedFines: 0,
    garbageCount: 0,
    spittingCount: 0,
    litteringCount: 0,
    unidentifiedCount: 0,
    overdueCount: 0,
    overdueAmount: 0,
    escalatedCount: 0,
    recentViolations: [],
    loading: true,
  });

  useEffect(() => {
    async function fetchStats() {
      const [citizensRes, violationsRes, recentRes] = await Promise.all([
        supabase.from('citizens').select('id', { count: 'exact', head: true }),
        supabase.from('violations').select('fine_amount, status, violation_type, citizen_id, due_date, escalation_level'),
        supabase.from('violations').select('*, citizen:citizens(*)').order('created_at', { ascending: false }).limit(8),
      ]);

      const violations = (violationsRes.data || []) as Violation[];
      const pending = violations.filter((v) => v.status === 'pending');
      const paid = violations.filter((v) => v.status === 'paid');
      const overdueViolations = violations.filter((v) => isOverdue(v));

      setStats({
        totalCitizens: citizensRes.count || 0,
        totalViolations: violations.length,
        pendingFines: pending.reduce((sum, v) => sum + Number(v.fine_amount), 0),
        collectedFines: paid.reduce((sum, v) => sum + Number(v.fine_amount), 0),
        garbageCount: violations.filter((v) => v.violation_type === 'garbage').length,
        spittingCount: violations.filter((v) => v.violation_type === 'spitting').length,
        litteringCount: violations.filter((v) => v.violation_type === 'littering').length,
        unidentifiedCount: violations.filter((v) => !v.citizen_id).length,
        overdueCount: overdueViolations.length,
        overdueAmount: overdueViolations.reduce((sum, v) => sum + Number(v.fine_amount), 0),
        escalatedCount: violations.filter((v) => v.escalation_level > 0 && v.status === 'pending').length,
        recentViolations: (recentRes.data || []) as (Violation & { citizen: Citizen | null })[],
        loading: false,
      });
    }
    fetchStats();
  }, []);

  return stats;
}
