// Print the problems in a ticket, with their counts, from the same code and data the kb pages use.
// Usage: node scripts/problems.mjs [ticket]   (default 4471)
import { createServer } from 'vite';

const ticket = Number(process.argv[2] ?? 4471);
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const load = (path) => server.ssrLoadModule(path);
  const { uniqueById } = await load('/src/lib/kb/causes.ts');
  const { groupByProblem, sharedSubjects, PROBLEM_SUMMARY } = await load('/src/lib/kb/problems.ts');
  const { tenantOf } = await load('/src/lib/kb/locales.ts');
  const reports = (await load('/src/lib/data/reports-4471.json')).default;
  const notes = (await load('/src/lib/data/desk-notes.json')).default;

  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const groups = groupByProblem(merged, tenantOf, notes.oneDayMove);
  console.log(
    JSON.stringify(
      {
        ticket,
        exportRows: reports.length,
        reports: merged.length,
        sharedSubjects: sharedSubjects(groups).length,
        problems: groups.map((g) => ({
          problem: g.problem,
          reports: g.reports.length,
          summary: PROBLEM_SUMMARY[g.problem],
          tenants: [...new Set(g.reports.map((r) => r.tenant))].sort(),
          channels: g.channels,
          taggedAs: g.taggedAs,
          firstSeen: g.firstSeen,
          lastSeen: g.lastSeen,
          ids: g.reports.map((r) => r.id).sort(),
        })),
      },
      null,
      2,
    ),
  );
} finally {
  await server.close();
}
