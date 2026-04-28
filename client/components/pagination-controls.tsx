import Link from 'next/link'

function buildHref(page: number, stack: string, budget: string) {
  const params = new URLSearchParams()

  if (page > 1) {
    params.set('page', String(page))
  }
  if (stack) {
    params.set('stack', stack)
  }
  if (budget) {
    params.set('budget', budget)
  }

  const query = params.toString()
  return query ? `/?${query}` : '/'
}

export function PaginationControls({
  page,
  stack,
  budget,
}: {
  page: number
  stack: string
  budget: string
}) {
  return (
    <div className="obsidian-frame flex items-center justify-between rounded-[1.75rem] px-4 py-3">
      <p className="text-sm text-[var(--muted)]">Page {page}</p>
      <div className="flex gap-2">
        <Link
          href={buildHref(Math.max(page - 1, 1), stack, budget)}
          className={`btn-secondary ${page === 1 ? 'pointer-events-none opacity-50' : ''}`}
        >
          Previous
        </Link>
        <Link href={buildHref(page + 1, stack, budget)} className="btn-primary">
          Next
        </Link>
      </div>
    </div>
  )
}
