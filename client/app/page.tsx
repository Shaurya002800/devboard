import { Suspense } from 'react'
import { PaginationControls } from '@/components/pagination-controls'
import { ProjectFeed } from '@/components/project-feed'
import { ProjectFilters } from '@/components/project-filters'
import { ProjectGridSkeleton } from '@/components/project-skeleton'

type HomeProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function Home({ searchParams }: HomeProps) {
  const params = searchParams ? await searchParams : {}
  const stack = typeof params.stack === 'string' ? params.stack : ''
  const budget = typeof params.budget === 'string' ? params.budget : ''
  const page =
    typeof params.page === 'string' ? Number.parseInt(params.page, 10) || 1 : 1

  return (
    <div className="flex flex-col gap-10">
      <section className="obsidian-frame fade-up overflow-hidden rounded-[2.4rem] px-6 py-8 sm:px-8 lg:px-12 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr] lg:items-end">
          <div className="space-y-5">
            <p className="eyebrow">Pitch black. High signal. Real builders.</p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl lg:text-6xl">
              Post ambitious software work and find developers who can actually
              ship it.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              DevBoard is a focused hiring board for indie products, startup
              experiments, and serious side projects. Clean briefs in. Strong
              applicants out.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="obsidian-chip">Pitch black UI</span>
              <span className="obsidian-chip">Warm amber accent</span>
              <span className="obsidian-chip">Built for product teams</span>
            </div>
          </div>

          <div className="grid gap-4 rounded-[2rem] border border-[var(--line)] bg-[rgba(41,37,36,0.38)] p-5 sm:grid-cols-3 lg:grid-cols-1">
            <div className="obsidian-stat">
              <p className="text-3xl font-semibold">01</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                List roles with stack, budget, and deadline in one clean brief.
              </p>
            </div>
            <div className="obsidian-stat">
              <p className="text-3xl font-semibold">02</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Let developers apply with focused context, not random cold DMs.
              </p>
            </div>
            <div className="obsidian-stat">
              <p className="text-3xl font-semibold">03</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Review applicants and move fast from idea to shipped MVP.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Browse Projects</p>
            <h2 className="mt-2 text-2xl font-semibold">Open opportunities</h2>
          </div>
          <p className="max-w-xl text-sm text-[var(--muted)]">
            Filter by stack or budget to narrow down projects that match your
            expertise and availability.
          </p>
        </div>

        <ProjectFilters initialStack={stack} initialBudget={budget} />

        <Suspense
          key={`${stack}-${budget}-${page}`}
          fallback={<ProjectGridSkeleton count={6} />}
        >
          <ProjectFeed page={page} stack={stack} budget={budget} />
        </Suspense>

        <PaginationControls page={page} stack={stack} budget={budget} />
      </section>
    </div>
  )
}
