import Link from 'next/link'
import { safeFetchProjects } from '@/lib/api'

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

export async function PaginationControls({
  page,
  stack,
  budget,
}: {
  page: number
  stack: string
  budget: string
}) {
  const { data } = await safeFetchProjects({ page, stack, budget, limit: 6 })
  const hasMore = Boolean(data?.pagination?.hasMore)
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
        {hasMore ? (
          <Link
            href={buildHref(page + 1, stack, budget)}
            className="btn-primary"
          >
            Next
          </Link>
        ) : (
          <span className="btn-primary opacity-50" aria-disabled="true">
            Next
          </span>
        )}
      </div>
    </div>
  )
}
