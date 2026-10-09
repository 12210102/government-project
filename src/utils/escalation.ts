import type { Violation, EscalationLevel } from '@/types';

export function getOverdueViolations(violations: Violation[]): Violation[] {
  return violations.filter((v) => v.status === 'pending' && v.due_date && new Date(v.due_date).getTime() < Date.now());
}

export function getDueSoonViolations(violations: Violation[]): Violation[] {
  const now = Date.now();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  return violations.filter((v) => {
    if (v.status !== 'pending' || !v.due_date) return false;
    const dueTime = new Date(v.due_date).getTime();
    return dueTime >= now && dueTime - now <= threeDaysMs;
  });
}

export function getEscalationStats(violations: Violation[]): {
  overdue: number;
  dueSoon: number;
  escalated: number;
  legalAction: number;
} {
  const overdue = getOverdueViolations(violations);
  const escalated = violations.filter((v) => v.escalation_level > 0 && v.status === 'pending');
  const legalAction = violations.filter((v) => v.escalation_level === 3 && v.status === 'pending');
  return {
    overdue: overdue.length,
    dueSoon: getDueSoonViolations(violations).length,
    escalated: escalated.length,
    legalAction: legalAction.length,
  };
}

export function getRecommendedEscalation(violation: Violation): EscalationLevel {
  if (violation.status !== 'pending') return 0;
  if (!violation.due_date) return 0;
  const daysOverdue = Math.floor((Date.now() - new Date(violation.due_date).getTime()) / (1000 * 60 * 60 * 24));
  if (daysOverdue >= 30) return 3;
  if (daysOverdue >= 15) return 2;
  if (daysOverdue >= 1) return 1;
  return 0;
}
