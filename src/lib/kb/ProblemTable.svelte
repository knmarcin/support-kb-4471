<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import tickets from '#lib/data/tickets-4471.json';
  import engineering from '#lib/data/engineering-4471.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { groupByProblem, sharedSubjects, PROBLEM_SUMMARY } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';

  let { ticket }: { ticket: number } = $props();

  const rows = (reports as Report[]).length;
  const merged = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByProblem(merged, tenantOf, notes.oneDayMove));
  const twice = $derived(groups.filter((g) => g.filedUnder.length));
  const subjects = $derived(new Set(merged.map((r) => r.subject)).size);
  const shared = $derived(sharedSubjects(groups).length);
  type Issue = { number: number; state: string; reason: string | null };
  type Outcome = { status: string; note: string };
  const issue = (problem: string): Issue | undefined => (tickets.issues as Record<string, Issue>)[problem];
  // What engineering did with each problem when it closed the ticket. No entry: nobody has worked on it.
  const outcome = (problem: string): Outcome | undefined => (engineering.outcomes as Record<string, Outcome>)[problem];
  const unsolved = $derived(groups.filter((g) => !outcome(g.problem)));
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
    <tr><th>problem</th><th>reports</th><th>what goes wrong</th><th>came in by</th><th>tenants</th><th>seen</th><th>engineering</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code></td>
        <td class="n">{g.reports.length}</td>
        <td>
          {PROBLEM_SUMMARY[g.problem]}
          {#if g.filedUnder.length}<span class="small">Filed under <code>{g.filedUnder.join(', ')}</code> by tenant.</span>{/if}
        </td>
        <td class="small">{list(g.channels)}</td>
        <td>{g.tenants}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if outcome(g.problem)}
            <b>{outcome(g.problem)?.status}</b> <span class="small">{outcome(g.problem)?.note}</span>
          {:else}
            <span class="none">no outcome — not worked on</span>
          {/if}
        </td>
        <td>
          {#if issue(g.problem)}
            <a href="https://github.com/{tickets.repo}/issues/{issue(g.problem)?.number}">#{issue(g.problem)?.number}</a>
            <span class:none={issue(g.problem)?.state === 'open'}>{issue(g.problem)?.state}{issue(g.problem)?.reason ? ` · ${issue(g.problem)?.reason}` : ''}</span>
          {:else}
            <span class="none">no ticket yet</span>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="note">
  The export has {rows} rows. Counted once per report id, that is {merged.length} reports.
</p>
{#each twice as g (g.problem)}
  <p class="note">
    The {g.reports.length} <code>{g.problem}</code> reports are also counted under <code>{g.filedUnder.join(', ')}</code>,
    where the desk files them by tenant. So the rows add up to more than {merged.length}.
  </p>
{/each}
<p class="note">
  Engineering closed #{engineering.ticket} on {engineering.closed}.
  {#if unsolved.length}
    Still open after that: {#each unsolved as g, i (g.problem)}{i ? ', ' : ''}<code>{g.problem}</code> ({g.reports.length} reports){/each}.
  {:else}
    Every problem above has an outcome.
  {/if}
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
