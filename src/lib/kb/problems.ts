// The problems inside a ticket. Pages explain it; this file is what runs.
//
// It counts the way the desk's own view counts (causes.ts, CauseTable): a report is filed under the
// cause its tenant gives it, `parser` or `hint`. The desk has also read some reports as something
// else (desk-notes.json, `oneDayMove`): the date moved by one day, it did not flip. Those stay
// filed where the desk files them, and they are a problem of their own on top.
import { groupByCause, type CauseGroup, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = CauseGroup['cause'] | 'one-day-move';

// One line per problem, for tables. Words only: every count is computed.
export const PROBLEM_SUMMARY: Record<Problem, string> = {
  parser: 'The shared parser reads every date month first, so a day-first tenant gets day and month flipped.',
  hint: 'The booking-v3 form prints the hint MM/DD/YYYY, people type the month first, and the form reads the day first.',
  'one-day-move': 'The date moves by one day. Day and month are not flipped.',
  unplaced: 'No day-first tenant on file, so the cause is not known.',
};

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  // Causes these reports are filed under in the desk's view, when the problem is not a cause itself.
  filedUnder: CauseGroup['cause'][];
  tenants: number;
  // How the reports came in: channel → count.
  channels: Record<string, number>;
  // Distinct subject lines among these reports.
  subjects: string[];
  firstSeen: string;
  lastSeen: string;
};

const tally = (keys: string[]) => keys.reduce<Record<string, number>>((n, k) => ({ ...n, [k]: (n[k] ?? 0) + 1 }), {});

function describe(problem: Problem, reports: Report[], filedUnder: CauseGroup['cause'][]): ProblemGroup {
  const days = reports.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports,
    filedUnder,
    tenants: new Set(reports.map((r) => r.tenant)).size,
    channels: tally(reports.map((r) => r.channel)),
    subjects: [...new Set(reports.map((r) => r.subject))].sort(),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

// One group per cause, exactly as the desk's view has them, then the reports the desk read as a
// one-day move. Those are counted twice on purpose: where they are filed, and as their own problem.
export function groupByProblem(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const causes = groupByCause(reports, tenantOf);
  const groups = causes.map((g) => describe(g.cause, g.reports, []));
  const moved = causes.flatMap((g) => g.reports.filter((r) => oneDayMove.includes(r.id)));
  if (moved.length) {
    const under = causes.filter((g) => g.reports.some((r) => oneDayMove.includes(r.id))).map((g) => g.cause);
    groups.push(describe('one-day-move', moved, under));
  }
  return groups;
}

// Subject lines that show up under more than one problem: why a subject match cannot tell them apart.
export function sharedSubjects(groups: ProblemGroup[]): string[] {
  const seenIn = new Map<string, number>();
  for (const g of groups) for (const s of g.subjects) seenIn.set(s, (seenIn.get(s) ?? 0) + 1);
  return [...seenIn.entries()].filter(([, n]) => n > 1).map(([s]) => s).sort();
}
