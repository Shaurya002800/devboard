import Link from 'next/link'

export function ProjectFilters({
  initialStack,
  initialBudget,
}: {
  initialStack: string
  initialBudget: string
}) {
  return (
    <form
      action="/"
      className="obsidian-frame grid gap-4 rounded-[2rem] p-5 md:grid-cols-[1fr_220px_auto]"
    >
      <div>
        <label
          className="mb-2 block text-sm font-semibold text-[var(--muted)]"
          htmlFor="stack"
        >
          Tech stack
        </label>
        <input
          id="stack"
          name="stack"
          defaultValue={initialStack}
          className="input"
          placeholder="react, node, next.js"
        />
      </div>
      <div>
        <label
          className="mb-2 block text-sm font-semibold text-[var(--muted)]"
          htmlFor="budget"
        >
          Max budget
        </label>
        <input
          id="budget"
          name="budget"
          type="number"
          min="0"
          defaultValue={initialBudget}
          className="input"
          placeholder="500"
        />
      </div>
      <div className="flex items-end gap-3">
        <button className="btn-primary flex-1" type="submit">
          Apply filters
        </button>
        <Link
          className="btn-secondary inline-flex items-center justify-center"
          href="/"
        >
          Reset
        </Link>
      </div>
    </form>
  )
}
