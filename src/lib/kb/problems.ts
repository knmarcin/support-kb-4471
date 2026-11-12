// Which problem a report is about. Pages explain it; this file is what runs.
//
// causes.ts places a report by its tenant: `parser` or `hint`. The desk has also read some reports
// as something else (desk-notes.json, `oneDayMove`): the date moved by one day, it did not flip.
// causes.ts counts those where they are filed and footnotes them. Here they are a problem of their
// own, so every report is counted once, under the problem it is really about.
import { causeOf, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'one-day-move' | 'unplaced';

// One line per problem, for tables. Words only: every count is computed.
export const PROBLEM_SUMMARY: Record<Problem, string> = {
  parser: 'The shared parser reads every date month first, so a day-first tenant gets day and month flipped.',
  hint: 'The booking-v3 form prints the hint MM/DD/YYYY, people type the month first, and the form reads the day first.',
  'one-day-move': 'The date moves by one day. Day and month are not flipped.',
  unplaced: 'No day-first tenant on file, so the cause is not known.',
};

export function problemOf(r: Pick<Report, 'id' | 'channel'>, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'one-day-move';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: number;
  // How the reports came in: channel → count.
  channels: Record<string, number>;
  // What intake tagged these reports as: tag → count.
  taggedAs: Record<string, number>;
  // Distinct subject lines among these reports.
  subjects: string[];
  firstSeen: string;
  lastSeen: string;
};

const tally = (keys: string[]) => keys.reduce<Record<string, number>>((n, k) => ({ ...n, [k]: (n[k] ?? 0) + 1 }), {});

// Every report lands in exactly one group. Largest group first.
export function groupByProblem(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const byProblem = new Map<Problem, Report[]>();
  for (const r of reports) {
    const problem = problemOf(r, tenantOf(r), oneDayMove);
    byProblem.set(problem, [...(byProblem.get(problem) ?? []), r]);
  }
  return [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: new Set(rs.map((r) => r.tenant)).size,
        channels: tally(rs.map((r) => r.channel)),
        taggedAs: tally(rs.map((r) => r.meta.intakeTag)),
        subjects: [...new Set(rs.map((r) => r.subject))].sort(),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}

// Subject lines that show up under more than one problem: why a subject match cannot tell them apart.
export function sharedSubjects(groups: ProblemGroup[]): string[] {
  const seenIn = new Map<string, number>();
  for (const g of groups) for (const s of g.subjects) seenIn.set(s, (seenIn.get(s) ?? 0) + 1);
  return [...seenIn.entries()].filter(([, n]) => n > 1).map(([s]) => s).sort();
}
