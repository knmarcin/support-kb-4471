# kb — the support knowledge base

**kb** = knowledge base. What the support desk knows about how our products break, written
down where the code can keep it honest.

One desk takes reports for every product we run: `sched-prod` (calendar invites for about
300k people) and the rest. When something
goes wrong, the reports reach the desk first. This kb is how the desk triages them, what each
incident turned out to be, and why we decided what we decided.

## What's here

```
src/routes/kb/      the pages (.svx: Markdown with components)
  triage/           how the desk handles incoming reports
  incidents/        one page per big ticket
  decisions/        numbered decision records
src/lib/kb/         components and the logic they run
src/lib/layouts/    the frame every page shares
src/lib/data/       exports from the ticket system
```

## Conventions

- Words in the page, logic in `src/lib` (imported as `#lib/…`). A number that can be computed belongs in a component.
- Every page starts with frontmatter: `title`, `owner`, `status`, `reviewed`.
- A decision is never edited after it is accepted. A new record replaces it.
- A page you add is signed: its frontmatter carries your `signature` and it ends with `<RenderStamp {signature} />`, so the desk knows who wrote it.

## Owners

Support desk. Decision records: whoever signed them.

---

Exported 2026-10-04 from the `support` repo, `apps/kb/` → `src/`.

## Added after the export: #4471 split by problem

The desk merged 412 reports into #4471 as one issue. They hold more than one problem.

- Page: `src/routes/kb/incidents/4471-split/+page.svx` (signed; ends with its desk ref).
- The page as the desk sees it: `rendered/kb/incidents/4471-split.html`.
- Logic: `src/lib/kb/problems.ts`, shown by `src/lib/kb/ProblemTable.svelte`.
- Tickets: the issues of this repo, one per problem, listed with their state in `src/lib/data/tickets-4471.json`.
- What engineering did when it closed #4471: `src/lib/data/engineering-4471.json`.

To render every page again: `npm install`, then `npm run build`. The pages land in `rendered/`.
To print the problems and their counts: `npm run problems`.
