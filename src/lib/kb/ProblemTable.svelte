<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import tickets from '#lib/data/tickets-4471.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { groupByProblem, sharedSubjects, PROBLEM_SUMMARY } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';

  let { ticket }: { ticket: number } = $props();

  const rows = (reports as Report[]).length;
  const merged = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByProblem(merged, tenantOf, notes.oneDayMove));
  const placed = $derived(groups.reduce((n, g) => n + g.reports.length, 0));
  const subjects = $derived(new Set(merged.map((r) => r.subject)).size);
  const shared = $derived(sharedSubjects(groups).length);
  const issue = (problem: string): number | undefined => (tickets.issues as Record<string, number>)[problem];
  const list = (counts: Record<string, number>) =>
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([key, n]) => `${key} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ·
  <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>what goes wrong</th><th>came in by</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code></td>
        <td class="n">{g.reports.length}</td>
        <td>{PROBLEM_SUMMARY[g.problem]}</td>
        <td class="small">{list(g.channels)}</td>
        <td>{g.tenants}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if issue(g.problem)}
            <a href="https://github.com/{tickets.repo}/issues/{issue(g.problem)}">{tickets.repo}#{issue(g.problem)}</a>
          {:else}
            <span class="none">no ticket yet</span>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="note">
  The export has {rows} rows. Counted once per report id, that is {merged.length} reports, and {placed} of them
  sit under exactly one problem above.
</p>
<p class="note">
  {shared} of the {subjects} subject lines in these reports appear under more than one problem.
</p>

<style>
  .sum { font-size: 1.1rem; }
  .n { font-weight: 600; }
  .small { color: var(--muted); font-size: 0.85em; }
  .note { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
</style>
